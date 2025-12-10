import React, { useState } from 'react';
import { Feedback, FeedbackStatus, FeedbackPriority } from '../../services/feedbackService';
import { format } from 'date-fns';

interface FeedbackItemProps {
  feedback: Feedback;
  onUpdate: (id: string, status: FeedbackStatus, response: string | undefined, priority: FeedbackPriority) => Promise<void>;
}

const FeedbackItem: React.FC<FeedbackItemProps> = ({ feedback, onUpdate }) => {
  const [showResponse, setShowResponse] = useState(false);
  const [response, setResponse] = useState(feedback.adminResponse || '');
  const [selectedStatus, setSelectedStatus] = useState(feedback.status);
  const [selectedPriority, setSelectedPriority] = useState(feedback.priority);

  const typeIcons: Record<string, string> = {
    category: '⭐',
    location: '📍',
    improvement: '💡',
    bug: '🐛',
    other: '💬'
  };

  const statusColors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-700',
    reviewed: 'bg-blue-100 text-blue-700',
    implemented: 'bg-green-100 text-green-700',
    rejected: 'bg-red-100 text-red-700'
  };

  const priorityColors: Record<string, string> = {
    low: 'bg-gray-100 text-gray-700',
    medium: 'bg-blue-100 text-blue-700',
    high: 'bg-red-100 text-red-700'
  };

  const handleStatusChange = async (newStatus: FeedbackStatus) => {
    setSelectedStatus(newStatus);
    await onUpdate(feedback.id, newStatus, feedback.adminResponse, selectedPriority);
  };

  const handlePriorityChange = async (newPriority: FeedbackPriority) => {
    setSelectedPriority(newPriority);
    await onUpdate(feedback.id, selectedStatus, feedback.adminResponse, newPriority);
  };

  const handleSaveResponse = async () => {
    await onUpdate(feedback.id, selectedStatus, response, selectedPriority);
    setShowResponse(false);
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-start space-x-4 flex-1">
          <div className="text-3xl">{typeIcons[feedback.type]}</div>
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-2">
              <h4 className="font-bold text-gray-800 text-lg">{feedback.title}</h4>
              <span className={`px-2 py-1 rounded text-xs font-medium ${priorityColors[feedback.priority]}`}>
                {feedback.priority === 'low' ? 'Baixa' : feedback.priority === 'medium' ? 'Média' : 'Alta'}
              </span>
            </div>
            <p className="text-gray-700 mb-3">{feedback.description}</p>
            <div className="flex items-center space-x-4 text-sm text-gray-500">
              <span>👤 {feedback.userName}</span>
              <span>📧 {feedback.userEmail}</span>
              <span>📅 {format(feedback.createdAt, 'dd/MM/yyyy HH:mm')}</span>
            </div>
          </div>
        </div>
        <span className={`px-3 py-1 rounded-lg text-sm font-medium ${statusColors[feedback.status]}`}>
          {feedback.status === 'pending' ? 'Pendente' :
           feedback.status === 'reviewed' ? 'Em Análise' :
           feedback.status === 'implemented' ? 'Implementado' :
           'Recusado'}
        </span>
      </div>

      {feedback.adminResponse && !showResponse && (
        <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-lg mb-4">
          <p className="text-sm font-semibold text-blue-900 mb-1">Sua resposta:</p>
          <p className="text-blue-800">{feedback.adminResponse}</p>
        </div>
      )}

      <div className="flex flex-wrap gap-2 mt-4">
        <button
          onClick={() => setShowResponse(!showResponse)}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
        >
          {showResponse ? 'Ocultar' : 'Responder/Atualizar'}
        </button>

        {!showResponse && (
          <>
            <select
              value={selectedStatus}
              onChange={(e) => handleStatusChange(e.target.value as FeedbackStatus)}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm"
            >
              <option value="pending">Pendente</option>
              <option value="reviewed">Em Análise</option>
              <option value="implemented">Implementado</option>
              <option value="rejected">Recusado</option>
            </select>

            <select
              value={selectedPriority}
              onChange={(e) => handlePriorityChange(e.target.value as FeedbackPriority)}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm"
            >
              <option value="low">Baixa Prioridade</option>
              <option value="medium">Média Prioridade</option>
              <option value="high">Alta Prioridade</option>
            </select>
          </>
        )}
      </div>

      {showResponse && (
        <div className="mt-4 space-y-3">
          <textarea
            value={response}
            onChange={(e) => setResponse(e.target.value)}
            placeholder="Escreva uma resposta ao usuário..."
            className="w-full px-4 py-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500"
            rows={4}
          />
          <div className="flex space-x-2">
            <button
              onClick={handleSaveResponse}
              className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
            >
              Salvar Resposta
            </button>
            <button
              onClick={() => setShowResponse(false)}
              className="px-6 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-medium transition-colors"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default FeedbackItem;
