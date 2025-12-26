import React, { useState } from 'react';
import { ModelSelector } from '../ModelSelector';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const ModelSettingsModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const [selectedModel, setSelectedModel] = useState<{ provider: string; model: string }>(() => ({
    provider: (() => { try { return localStorage.getItem('prompt_model_provider') || 'auto'; } catch { return 'auto'; } })(),
    model: (() => { try { return localStorage.getItem('prompt_model_name') || ''; } catch { return ''; } })()
  }));

  const handleSave = () => {
    try {
      localStorage.setItem('prompt_model_provider', selectedModel.provider);
      localStorage.setItem('prompt_model_name', selectedModel.model || '');
    } catch {}
    // dispatch sync event
    try {
      window.dispatchEvent(new CustomEvent('prompt_model_change', {
        detail: { provider: selectedModel.provider, modelName: selectedModel.model }
      }));
    } catch {}
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="w-full max-w-md bg-gray-900 rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">模型设置（全局）</h3>
        <div className="space-y-4">
          <div>
            <label className="text-sm text-gray-400 block mb-2">选择AI模型</label>
            <ModelSelector
              value={selectedModel}
              onChange={setSelectedModel}
              className="w-full"
            />
          </div>
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <button onClick={onClose} className="px-3 py-2 bg-white/5 rounded">取消</button>
          <button onClick={handleSave} className="px-3 py-2 bg-blue-600 rounded text-white">保存并同步</button>
        </div>
      </div>
    </div>
  );
};

export default ModelSettingsModal;


