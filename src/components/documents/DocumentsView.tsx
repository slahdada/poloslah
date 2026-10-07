import React, { useState, useMemo } from 'react';
import { useApp } from '../../hooks/useAppContext.tsx';
import { VehicleDocument } from '../../types/index.ts';
import { formatDate } from '../../services/calculations/formatters.ts';
import { Files, Plus, Search, FileText, Image as ImageIcon, AlertTriangle, ShieldCheck } from 'lucide-react';
import { DocumentUploadModal } from './DocumentUploadModal.tsx';
import { DocumentViewerModal } from './DocumentViewerModal.tsx';

export const DocumentsView: React.FC = () => {
  const { documents, saveDocument, deleteDocument } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [viewingDocument, setViewingDocument] = useState<VehicleDocument | null>(null);

  const filteredDocuments = useMemo(() => {
    return documents.filter((doc) => {
      if (selectedCategory !== 'all' && doc.category !== selectedCategory) {
        return false;
      }
      if (searchTerm.trim() !== '') {
        const q = searchTerm.toLowerCase();
        const matchTitle = doc.title.toLowerCase().includes(q);
        const matchNotes = doc.notes?.toLowerCase().includes(q);
        const matchFile = doc.fileName.toLowerCase().includes(q);
        return matchTitle || matchNotes || matchFile;
      }
      return true;
    });
  }, [documents, selectedCategory, searchTerm]);

  return (
    <div className="space-y-4 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            Documents & Justificatifs
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 font-normal">
              {documents.length} fichier(s)
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Cartes grises, assurances, factures de réparations et contrôles techniques
          </p>
        </div>

        <button
          onClick={() => setIsUploadOpen(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 font-semibold text-white text-xs sm:text-sm shadow-md transition min-h-[44px] self-start sm:self-auto"
        >
          <Plus className="h-4 w-4" />
          <span>Ajouter un document</span>
        </button>
      </div>

      {/* Barre de recherche et filtres de catégorie */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-3.5 space-y-3">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Rechercher un document par nom ou référence..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full min-h-[44px] rounded-xl border border-slate-700 bg-slate-800/90 pl-10 pr-4 py-2 text-xs sm:text-sm text-slate-100 placeholder:text-slate-500 focus:border-teal-500 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
          {[
            { id: 'all', label: 'Tous' },
            { id: 'carte_grise', label: 'Carte grise' },
            { id: 'assurance', label: 'Assurance' },
            { id: 'facture', label: 'Factures' },
            { id: 'controle_technique', label: 'Contrôle tech.' },
            { id: 'permis', label: 'Permis' },
            { id: 'autre', label: 'Autres' },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`min-h-[36px] px-3 py-1.5 rounded-xl font-medium transition shrink-0 ${
                selectedCategory === cat.id
                  ? 'bg-teal-500 text-slate-950 font-bold'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grille des documents */}
      {filteredDocuments.length === 0 ? (
        <div className="rounded-3xl border border-slate-800 bg-slate-900/40 p-12 text-center space-y-3">
          <Files className="h-10 w-10 text-slate-600 mx-auto" />
          <h3 className="text-sm font-semibold text-slate-200">Aucun document trouvé</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Photographiez ou importez votre carte grise, contrat d'assurance ou facture d'entretien pour les garder sous la main.
          </p>
          <button
            onClick={() => setIsUploadOpen(true)}
            className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-xs font-semibold text-white transition min-h-[44px]"
          >
            + Importer un document
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {filteredDocuments.map((doc) => {
            const isImage =
              doc.fileData.startsWith('data:image/') ||
              doc.mimeType?.startsWith('image/') ||
              /\.(jpg|jpeg|png|webp|gif)$/i.test(doc.fileName);

            const isExpired = doc.expiryDate && new Date(doc.expiryDate) < new Date();

            return (
              <div
                key={doc.id}
                onClick={() => setViewingDocument(doc)}
                className="group cursor-pointer rounded-2xl border border-slate-800 bg-slate-900/70 p-3.5 hover:border-slate-700 hover:bg-slate-850 transition flex flex-col justify-between shadow-sm"
              >
                <div className="space-y-3">
                  {/* Miniature / Aperçu */}
                  <div className="relative h-32 w-full rounded-xl overflow-hidden bg-slate-950 border border-slate-800 flex items-center justify-center">
                    {isImage ? (
                      <img
                        src={doc.fileData}
                        alt={doc.title}
                        className="h-full w-full object-cover transition-transform group-hover:scale-105 duration-200"
                      />
                    ) : (
                      <div className="flex flex-col items-center gap-1 text-slate-400">
                        <FileText className="h-8 w-8 text-teal-400" />
                        <span className="text-[10px] uppercase font-bold tracking-wider">PDF</span>
                      </div>
                    )}

                    {/* Badge expiration */}
                    {doc.expiryDate && (
                      <div
                        className={`absolute top-2 right-2 px-2 py-0.5 rounded-md text-[10px] font-bold shadow-md flex items-center gap-1 ${
                          isExpired
                            ? 'bg-rose-600 text-white'
                            : 'bg-slate-900/90 text-teal-300 border border-teal-500/30 backdrop-blur'
                        }`}
                      >
                        {isExpired && <AlertTriangle className="h-3 w-3" />}
                        <span>Exp : {formatDate(doc.expiryDate)}</span>
                      </div>
                    )}
                  </div>

                  {/* Infos texte */}
                  <div>
                    <span className="text-[10px] uppercase font-bold tracking-wider text-teal-400">
                      {doc.category.replace('_', ' ')}
                    </span>
                    <h3 className="font-semibold text-sm text-slate-100 group-hover:text-teal-300 transition truncate">
                      {doc.title}
                    </h3>
                    <p className="text-[11px] text-slate-400 mt-0.5 truncate">
                      {doc.fileName}{' '}
                      {doc.fileSize ? `• ${Math.round(doc.fileSize / 1024)} Ko` : ''}
                    </p>
                  </div>
                </div>

                <div className="pt-3 mt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500">
                  <span>Ajouté le {formatDate(doc.createdAt)}</span>
                  <span className="text-teal-400 group-hover:underline">Consulter</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal d'ajout de document */}
      <DocumentUploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onSave={async (newDoc) => {
          await saveDocument(newDoc);
        }}
      />

      {/* Visionneuse de document */}
      <DocumentViewerModal
        document={viewingDocument}
        onClose={() => setViewingDocument(null)}
        onDelete={async (id) => {
          await deleteDocument(id);
          setViewingDocument(null);
        }}
      />
    </div>
  );
};
