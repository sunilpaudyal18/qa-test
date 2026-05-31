import { useState, useEffect } from 'react';
import { Check, ArrowLeft, Plus, Trash2 } from 'lucide-react';
import { format } from 'date-fns';

const emptyForm = {
  testId: '',
  module: '',
  title: '',
  steps: [''],
  testData: [''],
  expectedResult: '',
  actualResult: '',
  status: 'Untested',
  priority: 'Medium',
  severity: 'Minor',
  bugLink: '',
  date: format(new Date(), 'yyyy-MM-dd'),
  screenshot: null,
};

export default function TestCaseForm({ onSubmit, onCancel, initialData, testCases = [] }) {
  const [formData, setFormData] = useState(emptyForm);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (initialData) {
      const formatted = { ...initialData };
      if (typeof formatted.steps === 'string') formatted.steps = formatted.steps.split('\n').filter(s => s.trim()) || [''];
      if (typeof formatted.testData === 'string') formatted.testData = formatted.testData ? [formatted.testData] : [''];
      setFormData({ bugLink: '', testId: '', ...formatted });
    } else {
      setFormData(emptyForm);
    }
  }, [initialData]);

  useEffect(() => {
    if (!initialData && formData.module && !formData.testId) {
      const prefix = formData.module.substring(0, 3).toUpperCase().replace(/[^A-Z]/g, 'TC');
      const count = testCases.filter(tc => tc.module === formData.module).length + 1;
      setFormData(prev => ({ ...prev, testId: `${prefix}_${count.toString().padStart(3, '0')}` }));
    }
  }, [formData.module, initialData, testCases]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleArrayChange = (key, index, value) => {
    const arr = [...formData[key]];
    arr[index] = value;
    setFormData(prev => ({ ...prev, [key]: arr }));
  };

  const handleAddItem = (key) => setFormData(prev => ({ ...prev, [key]: [...prev[key], ''] }));
  const handleRemoveItem = (key, index) => {
    const arr = formData[key].filter((_, i) => i !== index);
    setFormData(prev => ({ ...prev, [key]: arr.length ? arr : [''] }));
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file || !file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let w = img.width, h = img.height;
        const MAX = 1600;
        if (w > h && w > MAX) { h *= MAX / w; w = MAX; }
        else if (h > MAX) { w *= MAX / h; h = MAX; }
        canvas.width = w; canvas.height = h;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, w, h);
        ctx.drawImage(img, 0, 0, w, h);
        setFormData(prev => ({ ...prev, screenshot: canvas.toDataURL('image/jpeg', 0.75) }));
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      const success = await onSubmit({
        ...formData,
        steps: formData.steps.filter(s => s.trim()),
        testData: formData.testData.filter(t => t.trim()),
      });
      if (success !== false && !initialData) setFormData(emptyForm);
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputClass = "w-full px-3 py-2 rounded-lg border border-gray-700 bg-gray-800 text-sm text-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder-gray-500";
  const labelClass = "text-sm font-medium text-gray-300";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-gray-700 pb-4">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          {initialData ? 'Edit Test Case' : 'New Test Case'}
          {!initialData && formData.testId && (
            <span className="text-xs bg-indigo-900/40 text-indigo-300 px-2 py-0.5 rounded-full font-mono">{formData.testId}</span>
          )}
        </h2>
        {onCancel && (
          <button type="button" onClick={onCancel} className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-300 rounded-lg transition">
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className={labelClass}>Test ID</label>
            <input type="text" name="testId" value={formData.testId} onChange={handleChange} className={inputClass + ' font-mono'} placeholder="Auto-generated" />
          </div>
          <div>
            <label className={labelClass}>Module</label>
            <input type="text" name="module" value={formData.module} onChange={handleChange} className={inputClass} placeholder="e.g. Login" />
          </div>
          <div>
            <label className={labelClass}>Title</label>
            <input type="text" name="title" value={formData.title} onChange={handleChange} className={inputClass} placeholder="Test case title" />
          </div>
        </div>

        <div>
          <label className={labelClass}>Execution Steps</label>
          <div className="space-y-2 mt-1">
            {formData.steps.map((step, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <span className="text-xs font-mono text-gray-500 w-6 shrink-0">{idx + 1}.</span>
                <input type="text" value={step} onChange={e => handleArrayChange('steps', idx, e.target.value)}
                  className={inputClass} placeholder={`Step ${idx + 1}`} />
                {formData.steps.length > 1 && (
                  <button type="button" onClick={() => handleRemoveItem('steps', idx)} className="p-1.5 text-gray-500 hover:text-red-400">
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            ))}
            <button type="button" onClick={() => handleAddItem('steps')} className="flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300">
              <Plus size={14} /> Add Step
            </button>
          </div>
        </div>

        <div>
          <label className={labelClass}>Test Data</label>
          <div className="space-y-2 mt-1">
            {formData.testData.map((d, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <span className="text-xs font-mono text-gray-500 w-6 shrink-0">{idx + 1}.</span>
                <input type="text" value={d} onChange={e => handleArrayChange('testData', idx, e.target.value)}
                  className={inputClass} placeholder={`Data ${idx + 1}`} />
                {formData.testData.length > 1 && (
                  <button type="button" onClick={() => handleRemoveItem('testData', idx)} className="p-1.5 text-gray-500 hover:text-red-400">
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            ))}
            <button type="button" onClick={() => handleAddItem('testData')} className="flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300">
              <Plus size={14} /> Add Data Point
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Bug Ticket Link</label>
            <input type="text" name="bugLink" value={formData.bugLink} onChange={handleChange} placeholder="e.g. PROJ-102" className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Execution Date</label>
            <input type="date" name="date" value={formData.date} onChange={handleChange} className={inputClass} />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Expected Result</label>
            <textarea name="expectedResult" value={formData.expectedResult} onChange={handleChange} rows={3} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Actual Result</label>
            <textarea name="actualResult" value={formData.actualResult} onChange={handleChange} rows={3} className={inputClass} />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className={labelClass}>Status</label>
            <select name="status" value={formData.status} onChange={handleChange} className={inputClass}>
              <option value="Untested">Untested</option>
              <option value="Pass">Pass</option>
              <option value="Fail">Fail</option>
              <option value="Blocked">Blocked</option>
            </select>
          </div>
          <div>
            <label className={labelClass}>Priority</label>
            <select name="priority" value={formData.priority} onChange={handleChange} className={inputClass}>
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
              <option value="Critical">Critical</option>
            </select>
          </div>
          <div>
            <label className={labelClass}>Severity</label>
            <select name="severity" value={formData.severity} onChange={handleChange} className={inputClass}>
              <option value="Low">Low</option>
              <option value="Minor">Minor</option>
              <option value="Major">Major</option>
              <option value="Critical">Critical</option>
            </select>
          </div>
        </div>

        <div>
          <label className={labelClass}>Screenshot (optional)</label>
          <input type="file" accept="image/*" onChange={handleImageUpload} className="mt-1 text-sm text-gray-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-indigo-600 file:text-white hover:file:bg-indigo-700" />
          {formData.screenshot && (
            <div className="mt-2 relative inline-block">
              <img src={formData.screenshot} alt="Preview" className="h-20 rounded border border-gray-700" />
              <button type="button" onClick={() => setFormData(prev => ({ ...prev, screenshot: null }))}
                className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-red-600 text-white flex items-center justify-center text-xs">X</button>
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-700">
          {onCancel && (
            <button type="button" onClick={onCancel} className="px-4 py-2 text-sm font-medium text-gray-300 hover:text-white bg-gray-800 hover:bg-gray-700 rounded-lg transition">Cancel</button>
          )}
          <button type="submit" disabled={isSubmitting}
            className="px-6 py-2.5 bg-indigo-600 text-white rounded-lg font-medium flex items-center gap-2 hover:bg-indigo-700 transition disabled:opacity-50">
            {isSubmitting ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : <Check className="w-4 h-4" />}
            {isSubmitting ? 'Saving...' : (initialData ? 'Update' : 'Save')}
          </button>
        </div>
      </form>
    </div>
  );
}
