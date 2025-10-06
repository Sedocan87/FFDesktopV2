import React, { useState, useMemo, useRef, useEffect } from 'react';
import { DndContext, closestCenter, useSensor, useSensors, PointerSensor } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import useStore from '../store';
import { ChevronDownIcon } from '../components/icons/ChevronDownIcon';
import TrashIcon from '../components/icons/TrashIcon';
import { CURRENCIES } from '../lib/utils';
import Select from '../components/Select';
import Input from '../components/Input';
import Label from '../components/Label';
import jsPDF from 'jspdf';
import { invoiceTranslations } from '../lib/invoiceTranslations';
import ArrowLeftIcon from '../components/icons/ArrowLeftIcon';
import autoTable from 'jspdf-autotable';
import { formatCurrency } from '../lib/utils';

// --- Placeholder Components for Invoice Sections ---
const InvoiceHeader = ({ labels, invoiceNumber, onInvoiceNumberChange }) => (
  <div className="p-8 border-b flex justify-between items-start">
    <div>
      <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-200">{labels.invoice}</h2>
      <input
        type="text"
        value={invoiceNumber}
        onChange={onInvoiceNumberChange}
        maxLength="50"
        className="p-1 bg-transparent focus:outline-none focus:bg-slate-100 dark:focus:bg-slate-700 rounded-md"
      />
    </div>
    <div className="text-right">
      <p className="font-bold text-lg">Your Company</p>
      <p>123 Main St, Anytown, USA</p>
    </div>
  </div>
);
const ClientDetails = ({ labels, details, onDetailsChange }) => (
  <div className="p-8 border-b">
    <h3 className="font-bold mb-2">{labels.billedTo}</h3>
    <textarea
      value={details}
      onChange={onDetailsChange}
      className="w-full p-1 bg-transparent focus:outline-none focus:bg-slate-100 dark:focus:bg-slate-700 rounded-md"
      rows="3"
      placeholder="Select a client or enter details manually"
    />
  </div>
);
const LineItems = ({ labels, items, setItems, currency }) => {
  const currencySymbol = CURRENCIES.find(c => c.code === currency)?.symbol || '$';
  return (
    <div className="p-8">
      <table className="w-full text-left">
        <thead>
          <tr className="border-b">
            <th className="p-2">{labels.description}</th>
            <th className="p-2 text-right">{labels.quantity}</th>
            <th className="p-2 text-right">{labels.rate}</th>
            <th className="p-2 text-right">{labels.total}</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, index) => (
            <tr key={item.id}>
              <td className="p-2">
                <input
                  type="text"
                  value={item.description}
                  onChange={(e) => {
                    const newItems = items.map((item, i) => {
                      if (i === index) {
                        return { ...item, description: e.target.value };
                      }
                      return item;
                    });
                    setItems(newItems);
                  }}
                  className="w-full p-1 bg-transparent focus:outline-none focus:bg-slate-100 dark:focus:bg-slate-700 rounded-md"
                />
              </td>
              <td className="p-2 text-right">
                <input
                  type="number"
                  value={item.quantity}
                  onChange={(e) => {
                    const newItems = items.map((item, i) => {
                      if (i === index) {
                        return { ...item, quantity: parseFloat(e.target.value) || 0 };
                      }
                      return item;
                    });
                    setItems(newItems);
                  }}
                  className="w-20 p-1 bg-transparent focus:outline-none focus:bg-slate-100 dark:focus:bg-slate-700 rounded-md text-right"
                />
              </td>
              <td className="p-2 text-right">
                <input
                  type="number"
                  value={item.rate}
                  onChange={(e) => {
                    const newItems = items.map((item, i) => {
                      if (i === index) {
                        return { ...item, rate: parseFloat(e.target.value) || 0 };
                      }
                      return item;
                    });
                    setItems(newItems);
                  }}
                  className="w-24 p-1 bg-transparent focus:outline-none focus:bg-slate-100 dark:focus:bg-slate-700 rounded-md text-right"
                />
              </td>
              <td className="p-2 text-right">{currencySymbol}{((parseFloat(item.quantity) || 0) * (parseFloat(item.rate) || 0)).toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
const Totals = ({ labels, items, currency, tax }) => {
  const subtotal = items.reduce((acc, item) => acc + (parseFloat(item.quantity) || 0) * (parseFloat(item.rate) || 0), 0);
  const taxAmount = subtotal * (tax / 100);
  const total = subtotal + taxAmount;
  const currencySymbol = CURRENCIES.find(c => c.code === currency)?.symbol || '$';

  return (
    <div className="p-8 border-t mt-4 flex justify-end">
      <div className="w-1/3">
        <div className="flex justify-between py-1">
          <span className="font-semibold">{labels.subtotal}</span>
          <span>{currencySymbol}{subtotal.toFixed(2)}</span>
        </div>
        <div className="flex justify-between py-1">
          <span className="font-semibold">{labels.tax}</span>
          <span>{currencySymbol}{taxAmount.toFixed(2)}</span>
        </div>
        <div className="flex justify-between py-2 border-t mt-2">
          <span className="font-bold text-lg">{labels.total}</span>
          <span className="font-bold text-lg">{currencySymbol}{total.toFixed(2)}</span>
        </div>
      </div>
    </div>
  );
};
const Footer = ({ labels, notes, onNotesChange }) => (
  <div className="p-8 border-t mt-4">
    <h3 className="font-bold mb-2">{labels.notes}</h3>
    <textarea
      value={notes}
      onChange={onNotesChange}
      className="w-full p-1 bg-transparent focus:outline-none focus:bg-slate-100 dark:focus:bg-slate-700 rounded-md"
      rows="3"
    />
  </div>
);

const sectionComponents = {
  header: InvoiceHeader,
  clientDetails: ClientDetails,
  lineItems: LineItems,
  totals: Totals,
  footer: Footer,
};



const SortableItem = ({ id, labels, client, lineItems, setLineItems, currency, tax, invoiceNumber, onInvoiceNumberChange, notes, onNotesChange, billedToDetails, onBilledToDetailsChange }) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };
  const Component = sectionComponents[id];

  const componentProps = {
    labels,
    currency,
    tax,
    ...(id === 'header' && { invoiceNumber, onInvoiceNumberChange }),
    ...(id === 'clientDetails' && { details: billedToDetails, onDetailsChange: onBilledToDetailsChange }),
    ...(id === 'lineItems' && { items: lineItems, setItems: setLineItems }),
    ...(id === 'totals' && { items: lineItems, tax: tax }),
    ...(id === 'footer' && { notes, onNotesChange }),
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners} className="touch-none">
      <Component {...componentProps} />
    </div>
  );
};

export default function InvoiceStudioView({ onBack, invoiceToEdit, showToast }) {
  const invoiceTemplates = useStore(state => state.invoiceTemplates);
  const addInvoiceTemplate = useStore(state => state.addInvoiceTemplate);
  const deleteInvoiceTemplate = useStore(state => state.deleteInvoiceTemplate);
  const addStudioInvoice = useStore(state => state.addStudioInvoice);
  const clients = useStore(state => state.clients);
  const projects = useStore(state => state.projects);
  const timeEntries = useStore(state => state.timeEntries);
  const expenses = useStore(state => state.expenses);

  const currencySettings = useStore(state => state.currencySettings);
  const taxSettings = useStore(state => state.taxSettings);

  const [selectedClient, setSelectedClient] = useState(null);
  const [selectedItems, setSelectedItems] = useState([]);
  const [lineItems, setLineItems] = useState([]);
  const [templateCurrency, setTemplateCurrency] = useState(currencySettings.default);
  const [templateTax, setTemplateTax] = useState(taxSettings.rate);
  const [invoiceNumber, setInvoiceNumber] = useState('#INV-2023-001');
  const [notes, setNotes] = useState(invoiceTranslations[currencySettings.invoiceLanguage]?.thankYou || invoiceTranslations.en.thankYou);
  const [billedToDetails, setBilledToDetails] = useState('');
  const [templateLanguage, setTemplateLanguage] = useState(currencySettings.invoiceLanguage);

  useEffect(() => {
    if (invoiceToEdit) {
      const client = clients.find(c => c.name === invoiceToEdit.clientName);
      setLineItems(invoiceToEdit.items || []);
      setTemplateCurrency(invoiceToEdit.currency || currencySettings.default);
      setTemplateTax(invoiceToEdit.tax || taxSettings.rate);
      setInvoiceNumber(invoiceToEdit.invoiceNumber || '');
      setNotes(invoiceToEdit.notes || '');
      setBilledToDetails(invoiceToEdit.billedTo || '');
      setTemplateLanguage(invoiceToEdit.language || currencySettings.invoiceLanguage);
      if (client) {
        setSelectedClient(client.id);
      }
    }
  }, [invoiceToEdit, clients]);

  useEffect(() => {
    const newLabels = invoiceTranslations[templateLanguage] || invoiceTranslations.en;
    setLabels(newLabels);
    if (!invoiceToEdit) {
        setNotes(newLabels.thankYou);
    }
  }, [templateLanguage, invoiceToEdit]);

  const invoicePreviewRef = useRef(null);

  const handleSavePdf = () => {
    const doc = new jsPDF();
    const lang = templateLanguage || 'en';
    const t = invoiceTranslations[lang];
    const client = clients.find(c => c.id === selectedClient);

    // Add header
    doc.setFontSize(20);
    doc.text(t.invoice, 14, 22);

    // Add company details
    if (userProfile.logo) {
        doc.addImage(userProfile.logo, 'PNG', 150, 15, 45, 15);
    }
    doc.setFontSize(10);
    doc.text(userProfile.companyName, 150, 40);
    doc.text(userProfile.companyAddress, 150, 45);
    doc.text(userProfile.companyEmail, 150, 50);

    // Add client details
    doc.setFontSize(12);
    doc.text(t.billTo, 14, 40);
    doc.setFontSize(10);
    doc.text(client?.name || '', 14, 45);
    doc.text(client?.email || '', 14, 50);

    // Add invoice details
    doc.setFontSize(10);
    doc.text(`${t.issueDate} ${new Date().toISOString().split('T')[0]}`, 14, 60);
    doc.text(`${t.dueDate} ${new Date(new Date().setDate(new Date().getDate() + 30)).toISOString().split('T')[0]}`, 14, 65);

    // Add table
    const tableData = lineItems.map(item => {
        const amount = (parseFloat(item.quantity) || 0) * (parseFloat(item.rate) || 0);
        return [
            item.description,
            item.quantity,
            formatCurrency(item.rate, templateCurrency),
            formatCurrency(amount, templateCurrency)
        ];
    });

    autoTable(doc, {
        startY: 75,
        head: [[t.description, t.quantity, t.rate, t.amount]],
        body: tableData,
        theme: 'striped',
        headStyles: { fillColor: [22, 160, 133] },
    });

    // Add totals
    const subtotal = lineItems.reduce((acc, item) => acc + (parseFloat(item.quantity) || 0) * (parseFloat(item.rate) || 0), 0);
    const taxAmount = subtotal * (templateTax / 100);
    const total = subtotal + taxAmount;

    console.log({ subtotal, taxAmount, total, templateTax });

    let finalY = doc.lastAutoTable.finalY + 10;
    doc.setFontSize(10);
    doc.text(`${t.subtotal}`, 150, finalY);
    doc.text(formatCurrency(subtotal, templateCurrency), 180, finalY);
    finalY += 7;
    doc.text(`${t.tax} (${templateTax}%)`, 150, finalY);
    doc.text(formatCurrency(taxAmount, templateCurrency), 180, finalY);
    finalY += 7;
    doc.setFontSize(12);
    doc.text(`${t.total}`, 150, finalY);
    doc.text(formatCurrency(total, templateCurrency), 180, finalY);

    // Add thank you message
    doc.setFontSize(10);
    doc.text(notes, 14, doc.internal.pageSize.height - 20);

    doc.save(`${invoiceNumber}.pdf`);
    showToast('Invoice downloaded successfully!');
  };

  const handleSaveInvoice = () => {
    if (!selectedClient) {
      showToast('Please select a client before saving an invoice.');
      return;
    }

    const client = clients.find(c => c.id === selectedClient);

    console.log('lineItems', lineItems);

    const newInvoice = {
      id: `inv_${Date.now()}`,
      clientName: client.name,
      issueDate: new Date().toISOString().split('T')[0],
      dueDate: new Date(new Date().setDate(new Date().getDate() + 30)).toISOString().split('T')[0],
      amount: lineItems.reduce((acc, item) => acc + (parseFloat(item.quantity) || 0) * (parseFloat(item.rate) || 0), 0),
      currency: templateCurrency,
      status: 'Draft',
      items: lineItems.map(item => ({
        description: item.description,
        hours: parseFloat(item.quantity) || 0,
        rate: parseFloat(item.rate) || 0,
      })),
      notes: notes,
      billedTo: billedToDetails,
      language: templateLanguage,
      tax: templateTax,
      invoiceNumber: invoiceNumber,
    };

    console.log('Saving invoice:', newInvoice);
    addStudioInvoice(newInvoice);
    showToast('Invoice saved!');
    onBack();
  };


  const [allSections, setAllSections] = useState([
    { id: 'header', name: 'Header' },
    { id: 'clientDetails', name: 'Client Details' },
    { id: 'lineItems', name: 'Line Items' },
    { id: 'totals', name: 'Totals' },
    { id: 'footer', name: 'Footer' },
  ]);

  const [sections, setSections] = useState([
    { id: 'header', component: 'Header' },
    { id: 'clientDetails', component: 'ClientDetails' },
    { id: 'lineItems', component: 'LineItems' },
    { id: 'totals', component: 'Totals' },
    { id: 'footer', component: 'Footer' },
  ]);

  const [labels, setLabels] = useState({ 
    invoice: 'Invoice',
    billedTo: 'Billed To:',
    description: 'Description',
    quantity: 'Quantity',
    rate: 'Rate',
    total: 'Total',
    subtotal: 'Subtotal',
    tax: 'Tax',
    notes: 'Notes',
  });

  const [isLabelsExpanded, setIsLabelsExpanded] = useState(false);

  const unbilledItems = useMemo(() => {
    if (!selectedClient) return [];
    const clientProjects = projects.filter(p => p.clientId === selectedClient);
    const projectIds = clientProjects.map(p => p.id);

    const unbilledTime = timeEntries.filter(t => projectIds.includes(t.projectId) && !t.isBilled);
    const unbilledExpenses = expenses.filter(e => projectIds.includes(e.projectId) && !e.isBilled);

    return [...unbilledTime, ...unbilledExpenses];
  }, [selectedClient, projects, timeEntries, expenses]);

  const handleLabelChange = (event) => {
    const { name, value } = event.target;
    setLabels(prevLabels => ({ ...prevLabels, [name]: value }));
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (active.id !== over.id) {
      setSections((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const toggleSection = (sectionId) => {
    setSections(currentSections => {
      const isSectionPresent = currentSections.some(s => s.id === sectionId);
      if (isSectionPresent) {
        return currentSections.filter(s => s.id !== sectionId);
      } else {
        const sectionToAdd = allSections.find(s => s.id === sectionId);
        return [...currentSections, { id: sectionToAdd.id, component: sectionToAdd.name }];
      }
    });
  };

  const handleSaveTemplate = () => {
    const templateName = prompt('Enter a name for your template:');
    if (templateName) {
      const template = {
        id: crypto.randomUUID(),
        name: templateName,
        sections: sections.map(s => s.id),
        labels,
        lineItems,
        currency: templateCurrency,
        tax: templateTax,
        invoiceNumber,
        notes,
        billedToDetails,
        language: templateLanguage,
      };
      addInvoiceTemplate(template);
      showToast('Template saved!');
    }
  };

  const loadTemplate = (template) => {
    setLabels(template.labels);
    setSections(template.sections.map(id => ({ id, component: allSections.find(s => s.id === id).name })));
    setLineItems(template.lineItems || []);
    setTemplateCurrency(template.currency || currencySettings.default);
    setTemplateTax(template.tax || taxSettings.rate);
    setInvoiceNumber(template.invoiceNumber || '#INV-2023-001');
    setNotes(template.notes || 'Thank you for your business!');
    setBilledToDetails(template.billedToDetails || '');
    setTemplateLanguage(template.language || currencySettings.invoiceLanguage);
  };

  const handleSelectItem = (item, isChecked) => {
    const itemId = item.hasOwnProperty('hours') ? `time-${item.id}` : `exp-${item.id}`;
    if (isChecked) {
      const project = projects.find(p => p.id === item.projectId);
      const newItem = item.hasOwnProperty('hours')
        ? { 
            id: itemId,
            description: item.description || `Time entry for ${project?.name}`,
            quantity: item.hours,
            rate: project?.rate || 0,
          }
        : { 
            id: itemId,
            description: item.description,
            quantity: 1,
            rate: item.amount,
          };
      setLineItems(prev => [...prev, newItem]);
    } else {
      setLineItems(prev => prev.filter(i => i.id !== itemId));
    }
    setSelectedItems(prev => 
      isChecked ? [...prev, item] : prev.filter(i => i.id !== item.id)
    );
  };

  const client = clients.find(c => c.id === selectedClient);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <div className="flex h-full">
        <div className="w-1/3 bg-white dark:bg-slate-800 p-4 border-r border-slate-200 dark:border-slate-700 overflow-y-auto">
          <div className="flex items-center mb-4">
            {onBack && (
              <button onClick={onBack} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 mr-2">
                <ArrowLeftIcon className="w-5 h-5" />
              </button>
            )}
            <h2 className="text-xl font-bold">Invoice Customization</h2>
          </div>
          <div className="mb-4">
            <button
              onClick={handleSaveTemplate}
              className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg shadow-lg transform transition-transform duration-200 hover:scale-105 mb-2"
            >
              Save Template
            </button>
            <button
              onClick={handleSavePdf}
              className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-lg shadow-lg transform transition-transform duration-200 hover:scale-105 mb-2"
            >
              Save as PDF
            </button>
            <button
              onClick={handleSaveInvoice}
              className="w-full bg-purple-500 hover:bg-purple-600 text-white font-bold py-2 px-4 rounded-lg shadow-lg transform transition-transform duration-200 hover:scale-105"
            >
              Save Invoice
            </button>
          </div>
          <div className="mb-4">
            <h3 className="font-semibold mb-2">My Templates</h3>
            <div className="space-y-2">
              {invoiceTemplates.map(template => (
                <div key={template.id} className="flex items-center justify-between p-2 rounded-md bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 group">
                  <button
                    onClick={() => loadTemplate(template)}
                    className="flex-grow text-left"
                  >
                    {template.name}
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); deleteInvoiceTemplate(template.id); }}
                    className="p-1 rounded-md text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-white opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <TrashIcon className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
          <div className="mb-4">
            <h3 className="font-semibold mb-2">Language</h3>
            <Select
              value={templateLanguage}
              onChange={(e) => setTemplateLanguage(e.target.value)}
            >
              {Object.keys(invoiceTranslations).map(lang => (
                <option key={lang} value={lang}>{lang.toUpperCase()}</option>
              ))}
            </Select>
          </div>
          <div className="mb-4">
            <h3 className="font-semibold mb-2">Currency</h3>
            <Select
              value={templateCurrency}
              onChange={(e) => setTemplateCurrency(e.target.value)}
            >
              {CURRENCIES.map(c => <option key={c.code} value={c.code}>{c.name} ({c.code})</option>)}
            </Select>
          </div>
          <div className="mb-4">
            <Label htmlFor="templateTax">Tax Rate (%)</Label>
            <Input
              id="templateTax"
              type="number"
              value={templateTax}
              onChange={(e) => {
                const value = Math.min(99, Math.max(0, e.target.value));
                setTemplateTax(value);
              }}
              max="99"
            />
          </div>
          <div className="mb-4">
            <h3 className="font-semibold mb-2">Client</h3>
            <Select
              value={selectedClient || ''}
              onChange={(e) => {
                const clientId = e.target.value;
                setSelectedClient(clientId);
                const client = clients.find(c => c.id === clientId);
                if (client) {
                  setBilledToDetails(`${client.name}\n${client.email}`);
                }
                setSelectedItems([]); // Reset selected items when client changes
              }}
            >
              <option value="" disabled>Select a client</option>
              {clients.map(client => (
                <option key={client.id} value={client.id}>{client.name}</option>
              ))}
            </Select>
            <div className="space-y-2 mt-2">
              {unbilledItems.map(item => (
                <div key={item.id} className="flex items-center">
                  <input
                    type="checkbox"
                    id={`item-${item.id}`}
                    checked={selectedItems.some(i => i.id === item.id)}
                    onChange={(e) => handleSelectItem(item, e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <label htmlFor={`item-${item.id}`} className="ml-2 block text-sm text-gray-900 dark:text-gray-300">
                    {item.description || `Time: ${item.hours}h`} - ${projects.find(p => p.id === item.projectId)?.name}
                  </label>
                </div>
              ))}
            </div>
          </div>
          <div className="mb-4">
            <h3 className="font-semibold mb-2">Sections</h3>
            {allSections.map(section => (
              <div key={section.id} className="flex items-center mb-2">
                <input
                  type="checkbox"
                  id={`section-${section.id}`}
                  checked={sections.some(s => s.id === section.id)}
                  onChange={() => toggleSection(section.id)}
                  className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                <label htmlFor={`section-${section.id}`} className="ml-2 block text-sm text-gray-900 dark:text-gray-300">
                  {section.name}
                </label>
              </div>
            ))}
          </div>
          <div>
            <button 
              onClick={() => setIsLabelsExpanded(!isLabelsExpanded)}
              className="w-full flex justify-between items-center p-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700"
            >
              <h3 className="font-semibold">Labels</h3>
              <ChevronDownIcon className={`w-5 h-5 transform transition-transform ${isLabelsExpanded ? 'rotate-180' : ''}`} />
            </button>
            {isLabelsExpanded && (
              <div className="space-y-2 mt-2">
                <div>
                  <label htmlFor="invoice" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Invoice</label>
                  <input type="text" name="invoice" id="invoice" value={labels.invoice} onChange={handleLabelChange} className="mt-1 block w-full px-3 py-2 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
                </div>
                <div>
                  <label htmlFor="billedTo" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Billed To</label>
                  <input type="text" name="billedTo" id="billedTo" value={labels.billedTo} onChange={handleLabelChange} className="mt-1 block w-full px-3 py-2 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
                </div>
                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Description</label>
                  <input type="text" name="description" id="description" value={labels.description} onChange={handleLabelChange} className="mt-1 block w-full px-3 py-2 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
                </div>
                <div>
                  <label htmlFor="quantity" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Quantity</label>
                  <input type="text" name="quantity" id="quantity" value={labels.quantity} onChange={handleLabelChange} className="mt-1 block w-full px-3 py-2 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
                </div>
                <div>
                  <label htmlFor="rate" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Rate</label>
                  <input type="text" name="rate" id="rate" value={labels.rate} onChange={handleLabelChange} className="mt-1 block w-full px-3 py-2 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
                </div>
                <div>
                  <label htmlFor="total" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Total</label>
                  <input type="text" name="total" id="total" value={labels.total} onChange={handleLabelChange} className="mt-1 block w-full px-3 py-2 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
                </div>
                <div>
                  <label htmlFor="subtotal" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Subtotal</label>
                  <input type="text" name="subtotal" id="subtotal" value={labels.subtotal} onChange={handleLabelChange} className="mt-1 block w-full px-3 py-2 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
                </div>
                <div>
                  <label htmlFor="tax" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Tax</label>
                  <input type="text" name="tax" id="tax" value={labels.tax} onChange={handleLabelChange} className="mt-1 block w-full px-3 py-2 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
                </div>
                <div>
                  <label htmlFor="notes" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Notes</label>
                  <input type="text" name="notes" id="notes" value={labels.notes} onChange={handleLabelChange} className="mt-1 block w-full px-3 py-2 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
                </div>
              </div>
            )}
          </div>
        </div>
        <div className="w-2/3 p-4 bg-slate-50 dark:bg-slate-900">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">Live Preview</h2>
            <button 
              onClick={() => setLineItems(prev => [...prev, { id: crypto.randomUUID(), description: 'New Item', quantity: 1, rate: 0 }])}
              className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg"
            >
              Add Item
            </button>
          </div>
          <div ref={invoicePreviewRef} className="bg-white dark:bg-slate-800 p-8 rounded-lg shadow-lg">
            <SortableContext items={sections.map(s => s.id)} strategy={verticalListSortingStrategy}>
              {sections.map(section => <SortableItem key={section.id} id={section.id} labels={labels} client={client} lineItems={lineItems} setLineItems={setLineItems} currency={templateCurrency} tax={templateTax} invoiceNumber={invoiceNumber} onInvoiceNumberChange={(e) => setInvoiceNumber(e.target.value)} notes={notes} onNotesChange={(e) => setNotes(e.target.value)} billedToDetails={billedToDetails} onBilledToDetailsChange={(e) => setBilledToDetails(e.target.value)} />)}
            </SortableContext>
          </div>
        </div>
      </div>
    </DndContext>
  );
}