import { type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload } from 'lucide-react';

interface Props {
  title?: string;
  description?: string;
  icon?: ReactNode;
  action?: ReactNode;
}

export default function EmptyState({
  title = 'No data yet',
  description = 'Upload an Excel or CSV file to get started, or use Manual Entry to add data directly.',
  icon,
  action,
}: Props) {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center py-24 text-center animate-in">
      <div className="w-20 h-20 rounded-2xl bg-ink-100 flex items-center justify-center mb-5">
        {icon ?? <Upload size={32} className="text-ink-400" />}
      </div>
      <h3 className="text-lg font-semibold text-ink-800 mb-2">{title}</h3>
      <p className="text-sm text-ink-500 max-w-sm leading-relaxed mb-6">{description}</p>
      {action ?? (
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/upload')}
            className="btn-primary"
          >
            <Upload size={15} />
            Upload File
          </button>
          <button
            onClick={() => navigate('/entry')}
            className="btn-secondary"
          >
            Manual Entry
          </button>
        </div>
      )}
    </div>
  );
}
