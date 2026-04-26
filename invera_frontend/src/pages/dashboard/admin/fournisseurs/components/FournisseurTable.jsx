import React, { useState } from 'react';

const FournisseurTable = ({ fournisseurs, onEdit, onToggleStatus, text }) => {
  const [showConfirm, setShowConfirm] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);

  if (!fournisseurs || fournisseurs.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 bg-gray-50 py-12 text-center">
        <div className="mb-4 inline-block rounded-full bg-white p-4 shadow-sm">
          <svg className="h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
          </svg>
        </div>
        <h3 className="mb-1 text-lg font-medium text-gray-700">{text.emptyTitle}</h3>
        <p className="text-sm text-gray-500">{text.emptyDescription}</p>
      </div>
    );
  }

  const handleToggleClick = (id, isActive) => {
    setPendingAction({ id, isActive });
    setShowConfirm(true);
  };

  const handleConfirm = () => {
    if (pendingAction) {
      onToggleStatus(pendingAction.id, pendingAction.isActive);
    }
    setShowConfirm(false);
    setPendingAction(null);
  };

  const handleCancel = () => {
    setShowConfirm(false);
    setPendingAction(null);
  };

  return (
    <>
      <div className="w-full overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-gray-200 bg-gray-50">
              <tr>
                {[text.name, text.email, text.phone, text.city, text.country, text.status, text.actions].map((label) => (
                  <th key={label} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {fournisseurs.map((fournisseur, index) => (
                <tr
                  key={fournisseur.idFournisseur}
                  className={`transition-colors hover:bg-gray-50 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}
                >
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-green-100 text-sm font-semibold text-green-700">
                        {fournisseur.nomFournisseur?.charAt(0) || '?'}
                      </div>
                      <span className="ml-3 max-w-[150px] truncate text-sm font-medium text-gray-900">
                        {fournisseur.nomFournisseur}
                      </span>
                    </div>
                  </td>

                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className="max-w-[150px] truncate text-sm text-gray-600">{fournisseur.email || '-'}</span>
                  </td>

                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className="text-sm text-gray-600">{fournisseur.telephone || '-'}</span>
                  </td>

                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className="text-sm text-gray-600">{fournisseur.ville || '-'}</span>
                  </td>

                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className="rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-600">
                      {fournisseur.pays || '-'}
                    </span>
                  </td>

                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className={`text-sm font-medium ${fournisseur.actif ? 'text-green-700' : 'text-gray-500'}`}>
                      {fournisseur.actif ? text.activeStatus : text.inactiveStatus}
                    </span>
                  </td>

                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onEdit(fournisseur)}
                        className="rounded-md bg-blue-50 p-1.5 text-blue-600 transition-colors hover:bg-blue-600 hover:text-white"
                        title={text.edit}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>

                      <button
                        onClick={() => handleToggleClick(fournisseur.idFournisseur, fournisseur.actif)}
                        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                          fournisseur.actif ? 'bg-green-500' : 'bg-gray-300'
                        }`}
                        title={fournisseur.actif ? text.deactivate : text.activate}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            fournisseur.actif ? 'translate-x-5' : 'translate-x-0.5'
                          }`}
                        />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black bg-opacity-30" onClick={handleCancel}></div>
          <div className="relative w-80 rounded-lg bg-white p-5 shadow-xl">
            <h3 className="mb-2 text-lg font-medium text-gray-900">{text.confirmationTitle}</h3>
            <p className="mb-5 text-sm text-gray-600">
              {text.confirmToggle.replace(
                '{{action}}',
                pendingAction?.isActive ? text.deactivateVerb : text.activateVerb
              )}
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={handleCancel}
                className="rounded-lg bg-gray-100 px-4 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-200"
              >
                {text.cancel}
              </button>
              <button
                onClick={handleConfirm}
                className={`rounded-lg px-4 py-2 text-sm text-white transition-colors ${
                  pendingAction?.isActive ? 'bg-red-500 hover:bg-red-600' : 'bg-green-600 hover:bg-green-700'
                }`}
              >
                {text.confirm}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default FournisseurTable;
