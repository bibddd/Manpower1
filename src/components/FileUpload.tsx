import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileSpreadsheet, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { parseFile } from '../lib/parser';
import { useApp } from '../context';
import { cn } from '../lib/utils';

export default function FileUpload() {
  const { addEntries } = useApp();

  const onDrop = useCallback(async (accepted: File[]) => {
    for (const file of accepted) {
      const toastId = toast.loading(`Parsing ${file.name}...`);
      try {
        const result = await parseFile(file);
        if (result.entries.length > 0) {
          addEntries(result.entries);
          toast.success(
            `Imported ${result.entries.length} records from ${file.name}`,
            { id: toastId }
          );
        } else {
          toast.error(`No data found in ${file.name}`, { id: toastId });
        }
        if (result.errors.length > 0) {
          toast.error(`${result.errors.length} rows skipped (check console)`, { duration: 4000 });
          console.warn('Parse warnings:', result.errors);
        }
      } catch (err) {
        toast.error(`Failed to parse ${file.name}`, { id: toastId });
        console.error(err);
      }
    }
  }, [addEntries]);

  const { getRootProps, getInputProps, isDragActive, isDragReject, fileRejections } =
    useDropzone({
      onDrop,
      accept: {
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
        'application/vnd.ms-excel': ['.xls'],
        'text/csv': ['.csv'],
        'text/tab-separated-values': ['.tsv'],
        'text/plain': ['.txt'],
      },
      maxSize: 50 * 1024 * 1024,
    });

  return (
    <div>
      <div
        {...getRootProps()}
        className={cn(
          'border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-colors',
          isDragActive && !isDragReject && 'border-blue-400 bg-blue-50',
          isDragReject && 'border-red-400 bg-red-50',
          !isDragActive && 'border-slate-200 hover:border-blue-300 hover:bg-slate-50'
        )}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center gap-3">
          {isDragReject ? (
            <>
              <AlertCircle size={40} className="text-red-400" />
              <p className="text-red-600 font-medium">Unsupported file type</p>
            </>
          ) : (
            <>
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                {isDragActive ? (
                  <Upload size={32} className="text-blue-600" />
                ) : (
                  <FileSpreadsheet size={32} className="text-blue-600" />
                )}
              </div>
              <div>
                <p className="text-slate-700 font-semibold text-lg">
                  {isDragActive ? 'Drop files here' : 'Drag & drop files here'}
                </p>
                <p className="text-slate-400 text-sm mt-1">
                  or click to browse — supports .xlsx, .xls, .csv, .tsv, .txt
                </p>
              </div>
              <p className="text-slate-400 text-xs">Maximum file size: 50 MB</p>
            </>
          )}
        </div>
      </div>

      {fileRejections.length > 0 && (
        <div className="mt-3 p-3 bg-red-50 rounded-lg border border-red-200">
          {fileRejections.map(({ file, errors }) => (
            <div key={file.name} className="text-xs text-red-600">
              <span className="font-medium">{file.name}</span>: {errors.map((e) => e.message).join(', ')}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
