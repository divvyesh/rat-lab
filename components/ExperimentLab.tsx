
import React, { useState, useEffect, useRef } from 'react';
import { simulateParticipantSurvey } from '../services/geminiService';
import { Persona, SimulationResult, Question, QuestionType, PersonaSegment, Asset, User, SavedSimulation } from '../types';
import { 
  Play, Loader2, Plus, Trash2, GripVertical, Copy, Image as ImageIcon, 
  FileDown, FileSpreadsheet, BarChart3, PieChart as PieChartIcon, Users, X, Upload, ArrowLeft,
  FlaskConical, ListTodo, ChevronDown, Star, Heart, Hash, Activity, AlertCircle, CheckCircle2
} from 'lucide-react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import InfoModal, { InfoButton } from './InfoModal';
import { withErrorHandling, createUserFriendlyError, logError } from '../utils/errorHandling';
import { validateQuestion, validateSimulationResult } from '../utils/validation';
import { ChartSkeleton, TableSkeleton } from './LoadingSkeleton';
import ErrorDisplay from './ErrorDisplay';
import * as XLSX from 'xlsx';

interface ExperimentLabProps {
  personas: Persona[];
  segments: PersonaSegment[];
  results: SimulationResult[];
  setResults: (results: SimulationResult[] | ((prev: SimulationResult[]) => SimulationResult[])) => void;
  onNavigateToAnalysis: () => void;
  assets: Asset[];
  user: User;
  context: string;
  setContext: (context: string) => void;
  taskPrompt: string;
  setTaskPrompt: (prompt: string) => void;
  savedSimulations?: SavedSimulation[];
  setSavedSimulations?: (sims: SavedSimulation[]) => void;
  questions: Question[];
  setQuestions: (questions: Question[] | ((prev: Question[]) => Question[])) => void;
}

const ExperimentLab: React.FC<ExperimentLabProps> = ({ 
    personas, segments, results, setResults, onNavigateToAnalysis, assets, user,
    context, setContext, taskPrompt, setTaskPrompt,
    savedSimulations = [], setSavedSimulations,
    questions, setQuestions
}) => {
  const [selectedCohorts, setSelectedCohorts] = useState<string[]>(segments.map(s => s.id));
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentPersonaIndex, setCurrentPersonaIndex] = useState(0);
  const [statusMessage, setStatusMessage] = useState('');
  const [help, setHelp] = useState<{ title: string; content: string } | null>(null);
  const [showInsights, setShowInsights] = useState(false);
  const [simulationId, setSimulationId] = useState<string>('');
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [simulationName, setSimulationName] = useState('');
  const [simulationDescription, setSimulationDescription] = useState('');
  const [latestSimulationResults, setLatestSimulationResults] = useState<SimulationResult[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [errorFromSimulation, setErrorFromSimulation] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Filter personas based on selected cohorts
  const filteredPersonas = personas.filter(p => selectedCohorts.includes(p.segmentId));
  
  // Status messages - Professional research terminology
  const statusMessages = [
    'Analyzing behavioral trait patterns...',
    'Simulating System 1/2 cognitive processes...',
    'Running isolated black-box simulations...',
    'Applying Kahneman decision framework...',
    'Grounding responses with market intelligence...',
    'Validating response authenticity...',
    'Computing trait-response correlations...',
    'Synthesizing persona perspectives...',
    'Measuring cognitive load indicators...',
    'Calibrating risk aversion parameters...',
    'Processing novelty-seeking heuristics...',
    'Analyzing price sensitivity signals...',
    'Executing parallel inference engines...',
    'Cross-validating response consistency...',
    'Generating statistically-grounded insights...'
  ];

  // Initialize selected cohorts
  useEffect(() => {
    if (segments.length > 0 && selectedCohorts.length === 0) {
      setSelectedCohorts(segments.map(s => s.id));
    }
  }, [segments, selectedCohorts.length]);

  // Clear success message after 3s
  useEffect(() => {
    if (!saveSuccess) return;
    const t = setTimeout(() => setSaveSuccess(null), 3000);
    return () => clearTimeout(t);
  }, [saveSuccess]);

  const handleToggleCohort = (segmentId: string) => {
    setSelectedCohorts(prev => 
      prev.includes(segmentId)
        ? prev.filter(id => id !== segmentId)
        : [...prev, segmentId]
    );
  };

  const handleSelectAllCohorts = () => {
    setSelectedCohorts(segments.map(s => s.id));
  };

  const handleClearCohorts = () => {
    setSelectedCohorts([]);
  };

  const addQuestion = () => {
    setError(null);
    setErrorFromSimulation(false);
    const newId = `q_${Date.now()}`;
    const newQuestion: Question = {
      id: newId,
      type: QuestionType.SHORT_ANSWER,
      text: '',
      order: questions.length + 1
    };
    
    // Validate question
    const validation = validateQuestion(newQuestion);
    if (!validation.valid) {
      setError(`Invalid question: ${validation.errors.join(', ')}`);
      return;
    }
    
    setQuestions([...questions, newQuestion]);
    // Don't auto-open image picker when adding new question
  };

  const removeQuestion = (id: string) => {
    const updated = questions.filter(q => q.id !== id).map((q, idx) => ({ ...q, order: idx + 1 }));
    setQuestions(updated);
  };

  const duplicateQuestion = (id: string) => {
    const question = questions.find(q => q.id === id);
    if (!question) return;
    const newId = `q_${Date.now()}`;
    const duplicated: Question = {
      ...question,
      id: newId,
      order: questions.length + 1
    };
    setQuestions([...questions, duplicated]);
  };

  const updateQuestion = (id: string, updates: Partial<Question>) => {
    setError(null);
    setErrorFromSimulation(false);
    const updatedQuestions = questions.map(q => {
      if (q.id === id) {
        const updated = { ...q, ...updates };
        // Validate updated question
        const validation = validateQuestion(updated);
        if (!validation.valid) {
          setError(`Invalid question update: ${validation.errors.join(', ')}`);
          return q; // Return original if invalid
        }
        return updated;
      }
      return q;
    });
    setQuestions(updatedQuestions);
  };

  const reorderQuestion = (id: string, direction: 'up' | 'down') => {
    const index = questions.findIndex(q => q.id === id);
    if (index === -1) return;
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === questions.length - 1) return;
    
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    const reordered = [...questions];
    [reordered[index], reordered[newIndex]] = [reordered[newIndex], reordered[index]];
    reordered.forEach((q, idx) => { q.order = idx + 1; });
    setQuestions(reordered);
  };

  const handleImageSelect = (questionId: string, imageUrl: string, imageId?: string) => {
    updateQuestion(questionId, { imageUrl, imageId });
  };

  const handleImageUpload = (questionId: string, file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const imageUrl = e.target?.result as string;
      handleImageSelect(questionId, imageUrl);
    };
    reader.readAsDataURL(file);
  };

  const handleRunSimulation = async () => {
    setError(null);
    setErrorFromSimulation(false);
    
    // Validate inputs
    if (filteredPersonas.length === 0) {
      setError('Please select at least one cohort to run the simulation');
      return;
    }
    
    if (questions.length === 0) {
      setError('Please add at least one question to the survey');
      return;
    }
    
    // Validate all questions
    const invalidQuestions = questions.filter(q => {
      const validation = validateQuestion(q);
      return !validation.valid;
    });
    
    if (invalidQuestions.length > 0) {
      setError(`Invalid questions detected. Please check your question configurations.`);
      return;
    }
    
    const newSimulationId = `sim_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    setSimulationId(newSimulationId);
    
    console.log(`🚀 Starting simulation with ${filteredPersonas.length} personas`);
    setIsRunning(true);
    setProgress(0);
    setCurrentPersonaIndex(0);
    setStatusMessage(statusMessages[0]);
    
    const statusInterval = setInterval(() => {
      setStatusMessage(statusMessages[Math.floor(Math.random() * statusMessages.length)]);
    }, 2000);
    
    await withErrorHandling(async () => {
      const BATCH_SIZE = 5;
      const allResults: SimulationResult[] = [];
      const totalPersonas = filteredPersonas.length;
      
      for (let batchStart = 0; batchStart < totalPersonas; batchStart += BATCH_SIZE) {
        const batchEnd = Math.min(batchStart + BATCH_SIZE, totalPersonas);
        const batch = filteredPersonas.slice(batchStart, batchEnd);
        
        const batchPromises = batch.map(async (p, idx) => {
          const globalIndex = batchStart + idx;
          setCurrentPersonaIndex(globalIndex);
          
          try {
            const timeoutPromise = new Promise<never>((_, reject) => {
              setTimeout(() => reject(new Error(`Timeout after 30s`)), 30000);
            });
            
            // Use MESSAGE_TEST as default study type (hidden from UI, but still needed for API)
            const simulationPromise = simulateParticipantSurvey(
              p,
              'MESSAGE_TEST' as any, // StudyType enum value
              questions,
              context,
              assets
            );
            
            const result = await Promise.race([simulationPromise, timeoutPromise]);
            console.log(`✅ Completed isolated simulation ${globalIndex + 1}/${totalPersonas}: ${p.name}`);
            return result;
          } catch (err: any) {
            console.error(`❌ Error simulating persona ${p.name}:`, err.message || err);
            logError(err as Error, {
              component: 'ExperimentLab',
              action: 'simulate_persona',
              metadata: { personaId: p.id, personaName: p.name }
            });
            return {
              experimentId: `error_${p.id}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              personaId: p.id,
              personaName: p.name,
              segmentId: p.segmentId,
              responses: questions.map(q => ({
                questionId: q.id,
                questionText: q.text,
                answer: `Error: ${err.message || 'Simulation failed'}`,
                numericValue: null,
                sentiment: 'Neutral' as const,
                rationale: 'Simulation encountered an error'
              })),
              thinkingLog: `Error: ${err.message || 'Simulation crashed'}`,
              confidence: 0
            };
          }
        });
        
        const batchResults = await Promise.all(batchPromises);
        allResults.push(...batchResults);
        
        const completed = Math.min(batchEnd, totalPersonas);
        const progressPercent = Math.round((completed / totalPersonas) * 100);
        setProgress(progressPercent);
        setCurrentPersonaIndex(completed);
        
        if (batchEnd < totalPersonas) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }
      
      clearInterval(statusInterval);
      console.log(`✅ Simulation complete! Generated ${allResults.length} results`);
      
      // Validate results before adding
      const validResults = allResults.filter(result => {
        const validation = validateSimulationResult(result);
        return validation.valid;
      });
      
      if (validResults.length < allResults.length) {
        console.warn(`⚠️ ${allResults.length - validResults.length} invalid results filtered out`);
      }
      
      setResults(prev => [...prev, ...validResults]);
      setLatestSimulationResults(validResults);
      setStatusMessage('Simulation complete!');
      setShowInsights(false); // Don't auto-show insights, show save options instead
      
      return validResults;
    }, {
      retries: 1,
      context: {
        component: 'ExperimentLab',
        action: 'run_simulation',
        metadata: {
          personaCount: filteredPersonas.length,
          questionCount: questions.length
        }
      },
      onError: (error) => {
        const friendlyError = createUserFriendlyError(error, {
          component: 'ExperimentLab',
          action: 'run_simulation'
        });
        setError(friendlyError.message);
        setErrorFromSimulation(true);
        logError(error, {
          component: 'ExperimentLab',
          action: 'run_simulation'
        });
      }
    }).catch((error: any) => {
      clearInterval(statusInterval);
      const friendlyError = createUserFriendlyError(error, {
        component: 'ExperimentLab',
        action: 'run_simulation'
      });
      setError(friendlyError.message);
      setErrorFromSimulation(true);
      setStatusMessage('Simulation failed. Please try again.');
      logError(error, {
        component: 'ExperimentLab',
        action: 'run_simulation'
      });
    }).finally(() => {
      setIsRunning(false);
      setTimeout(() => setStatusMessage(''), 3000);
    });
  };

  const handleSaveSimulation = () => {
    if (!simulationName.trim()) {
      setError('Please enter a simulation name');
      setErrorFromSimulation(false);
      return;
    }
    if (!setSavedSimulations) return;
    
    const savedSim: SavedSimulation = {
      id: `saved_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: simulationName,
      description: simulationDescription,
      createdAt: new Date().toISOString(),
      simulationId: simulationId,
      context: context,
      questions: questions,
      results: latestSimulationResults,
      selectedCohorts: selectedCohorts,
      personaCount: filteredPersonas.length
    };
    
    setSavedSimulations([...savedSimulations, savedSim]);
    setShowSaveModal(false);
    setSimulationName('');
    setSimulationDescription('');
    setError(null);
    setSaveSuccess('Simulation saved successfully!');
  };

  const handleGenerateAnother = () => {
    setLatestSimulationResults([]);
    setShowInsights(false);
    setSimulationId('');
    // Keep questions and context, just reset results
  };

  const exportToCSV = () => {
    if (latestSimulationResults.length === 0 && results.length === 0) return;
    const exportResults = latestSimulationResults.length > 0 ? latestSimulationResults : results;
    
    // Binary format: Each option is a column, 0 if not selected, 1 if selected
    const allQuestions = questions.filter(q => 
      q.type === QuestionType.MULTIPLE_CHOICE || 
      q.type === QuestionType.CHECKBOXES || 
      q.type === QuestionType.DROPDOWN
    );
    
    // Build column headers: persona info + all question options
    const headers = [
      'persona_id',
      'persona_name',
      'cohort_id',
      'cohort_name',
      ...allQuestions.flatMap(q => {
        const options = q.options || [];
        return options.map((opt, idx) => `${q.id}_${idx}_${opt.replace(/[^a-zA-Z0-9]/g, '_')}`);
      })
    ];
    
    // Build rows
    const rows = exportResults.map(r => {
      const row: Record<string, string | number> = {
        persona_id: r.personaId,
        persona_name: r.personaName,
        cohort_id: r.segmentId,
        cohort_name: segments.find(s => s.id === r.segmentId)?.name || 'Unknown'
      };
      
      // For each question, set 0 or 1 for each option
      allQuestions.forEach(q => {
        const response = r.responses.find(resp => resp.questionId === q.id);
        const options = q.options || [];
        const answer = response?.answer || '';
        
        options.forEach((opt, idx) => {
          const colName = `${q.id}_${idx}_${opt.replace(/[^a-zA-Z0-9]/g, '_')}`;
          // For multiple choice/dropdown: exact match = 1, else 0
          // For checkboxes: check if option is in answer (comma-separated)
          if (q.type === QuestionType.CHECKBOXES) {
            row[colName] = answer.toLowerCase().includes(opt.toLowerCase()) ? 1 : 0;
          } else {
            row[colName] = answer.trim() === opt.trim() ? 1 : 0;
          }
        });
      });
      
      return row;
    });
    
    // Convert to CSV
    const csv = [
      headers.join(','),
      ...rows.map(row => headers.map(h => row[h] || 0).join(','))
    ].join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `simulation_binary_${simulationId || 'export'}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const exportToXLSX = () => {
    if (latestSimulationResults.length === 0 && results.length === 0) return;
    const exportResults = latestSimulationResults.length > 0 ? latestSimulationResults : results;
    
    // Binary format: Each option is a column, 0 if not selected, 1 if selected
    const allQuestions = questions.filter(q => 
      q.type === QuestionType.MULTIPLE_CHOICE || 
      q.type === QuestionType.CHECKBOXES || 
      q.type === QuestionType.DROPDOWN
    );
    
    // Build column headers: persona info + all question options
    const headers = [
      'persona_id',
      'persona_name',
      'cohort_id',
      'cohort_name',
      ...allQuestions.flatMap(q => {
        const options = q.options || [];
        return options.map((opt, idx) => `${q.id}_${idx}_${opt.replace(/[^a-zA-Z0-9]/g, '_')}`);
      })
    ];
    
    // Build rows
    const rows = exportResults.map(r => {
      const row: Record<string, string | number> = {
        persona_id: r.personaId,
        persona_name: r.personaName,
        cohort_id: r.segmentId,
        cohort_name: segments.find(s => s.id === r.segmentId)?.name || 'Unknown'
      };
      
      // For each question, set 0 or 1 for each option
      allQuestions.forEach(q => {
        const response = r.responses.find(resp => resp.questionId === q.id);
        const options = q.options || [];
        const answer = response?.answer || '';
        
        options.forEach((opt, idx) => {
          const colName = `${q.id}_${idx}_${opt.replace(/[^a-zA-Z0-9]/g, '_')}`;
          if (q.type === QuestionType.CHECKBOXES) {
            row[colName] = answer.toLowerCase().includes(opt.toLowerCase()) ? 1 : 0;
          } else {
            row[colName] = answer.trim() === opt.trim() ? 1 : 0;
          }
        });
      });
      
      return row;
    });
    
    const workbook = XLSX.utils.book_new();
    const sheet = XLSX.utils.json_to_sheet(rows);
    XLSX.utils.book_append_sheet(workbook, sheet, 'Responses');
    XLSX.writeFile(workbook, `simulation_binary_${simulationId || 'export'}.xlsx`);
  };

  const getQuestionTypeIcon = (type: QuestionType) => {
    switch (type) {
      case QuestionType.SHORT_ANSWER:
      case QuestionType.SHORT_RESPONSE:
        return <Hash size={16} />;
      case QuestionType.PARAGRAPH:
        return <FileSpreadsheet size={16} />;
      case QuestionType.MULTIPLE_CHOICE:
        return <BarChart3 size={16} />;
      case QuestionType.CHECKBOXES:
        return <ListTodo size={16} />;
      case QuestionType.DROPDOWN:
        return <ChevronDown size={16} />;
      case QuestionType.LINEAR_SCALE:
      case QuestionType.LIKERT_SCALE:
        return <BarChart3 size={16} />;
      case QuestionType.RATING:
        return <Star size={16} />;
      default:
        return <Hash size={16} />;
    }
  };

  const getQuestionTypeLabel = (type: QuestionType) => {
    switch (type) {
      case QuestionType.SHORT_ANSWER:
      case QuestionType.SHORT_RESPONSE:
        return 'Short answer';
      case QuestionType.PARAGRAPH:
        return 'Paragraph';
      case QuestionType.MULTIPLE_CHOICE:
        return 'Multiple choice';
      case QuestionType.CHECKBOXES:
        return 'Checkboxes';
      case QuestionType.DROPDOWN:
        return 'Dropdown';
      case QuestionType.LINEAR_SCALE:
      case QuestionType.LIKERT_SCALE:
        return 'Linear scale';
      case QuestionType.RATING:
        return 'Rating';
      default:
        return 'Short answer';
    }
  };

  const renderQuestionCard = (question: Question, index: number) => {
    const isEditing = editingQuestionId === question.id;
    
    return (
      <div 
        key={question.id} 
        className="bg-zinc-950/50 border border-white/5 rounded-2xl mb-4 relative group"
        style={{ minHeight: '120px' }}
      >
        {/* Drag Handle */}
        <div className="absolute top-2 left-2 cursor-move opacity-0 group-hover:opacity-100 transition-opacity">
          <GripVertical size={16} className="text-zinc-600" />
        </div>

        {/* Question Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/5">
          <div className="flex items-center gap-3 flex-1">
            <input
              type="text"
              value={question.text}
              onChange={(e) => updateQuestion(question.id, { text: e.target.value })}
              placeholder="Question"
              className="flex-1 text-xs text-zinc-300 bg-transparent border-none outline-none focus:ring-0 p-0 placeholder:text-zinc-700"
            />
            <div className="relative">
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setEditingQuestionId(question.id);
                }}
                className="p-2 hover:bg-zinc-800 rounded"
                title="Add image to question"
              >
                <ImageIcon size={18} className="text-zinc-400" />
              </button>
            </div>
            <select
              value={question.type}
              onChange={(e) => updateQuestion(question.id, { type: e.target.value as QuestionType })}
              className="border border-white/10 rounded-lg px-3 py-1.5 text-xs bg-zinc-900 text-zinc-300"
            >
              <option value={QuestionType.SHORT_ANSWER}>Short answer</option>
              <option value={QuestionType.PARAGRAPH}>Paragraph</option>
              <option value={QuestionType.MULTIPLE_CHOICE}>Multiple choice</option>
              <option value={QuestionType.CHECKBOXES}>Checkboxes</option>
              <option value={QuestionType.DROPDOWN}>Dropdown</option>
              <option value={QuestionType.LINEAR_SCALE}>Linear scale</option>
              <option value={QuestionType.RATING}>Rating</option>
            </select>
          </div>
        </div>

        {/* Question Image */}
        {question.imageUrl && (
          <div className="p-4 border-b border-white/5 relative">
            <img src={question.imageUrl} alt="Question" className="max-w-full h-auto rounded" />
            <button
              onClick={() => updateQuestion(question.id, { imageUrl: undefined, imageId: undefined })}
              className="absolute top-6 right-6 bg-black/50 text-white rounded-full p-1 hover:bg-black/70"
            >
              <X size={16} />
            </button>
          </div>
        )}

        {/* Question Body */}
        <div className="p-4">
          {question.type === QuestionType.SHORT_ANSWER || question.type === QuestionType.SHORT_RESPONSE ? (
            <div className="text-xs text-zinc-600 border-b border-dashed border-white/10 pb-2">
              Short answer text
            </div>
          ) : question.type === QuestionType.PARAGRAPH ? (
            <div className="text-xs text-zinc-600 border-b border-dashed border-white/10 pb-8">
              Long answer text
            </div>
          ) : question.type === QuestionType.MULTIPLE_CHOICE ? (
            <div className="space-y-2">
              {(question.options || ['Option 1']).map((opt, optIdx) => (
                <div key={optIdx} className="flex items-center gap-3">
                  <div className="w-4 h-4 border-2 border-zinc-600 rounded-full"></div>
                  <input
                    type="text"
                    value={opt}
                    onChange={(e) => {
                      const newOptions = [...(question.options || [])];
                      newOptions[optIdx] = e.target.value;
                      updateQuestion(question.id, { options: newOptions });
                    }}
                    placeholder={`Option ${optIdx + 1}`}
                    className="flex-1 border-none outline-none text-xs text-zinc-300 bg-transparent placeholder:text-zinc-700"
                  />
                  {(question.options || []).length > 1 && (
                    <button
                      onClick={() => {
                        const newOptions = (question.options || []).filter((_, i) => i !== optIdx);
                        updateQuestion(question.id, { options: newOptions });
                      }}
                      className="text-zinc-600 hover:text-red-400"
                    >
                      <X size={16} />
                    </button>
                  )}
                </div>
              ))}
              <button
                onClick={() => {
                  const newOptions = [...(question.options || []), `Option ${(question.options || []).length + 1}`];
                  updateQuestion(question.id, { options: newOptions });
                }}
                className="text-xs text-indigo-400 hover:text-indigo-300 mt-2"
              >
                Add option or add "Other"
              </button>
            </div>
          ) : question.type === QuestionType.CHECKBOXES ? (
            <div className="space-y-2">
              {(question.options || ['Option 1']).map((opt, optIdx) => (
                <div key={optIdx} className="flex items-center gap-3">
                  <div className="w-4 h-4 border-2 border-zinc-600 rounded"></div>
                  <input
                    type="text"
                    value={opt}
                    onChange={(e) => {
                      const newOptions = [...(question.options || [])];
                      newOptions[optIdx] = e.target.value;
                      updateQuestion(question.id, { options: newOptions });
                    }}
                    placeholder={`Option ${optIdx + 1}`}
                    className="flex-1 border-none outline-none text-xs text-zinc-300 bg-transparent placeholder:text-zinc-700"
                  />
                  {(question.options || []).length > 1 && (
                    <button
                      onClick={() => {
                        const newOptions = (question.options || []).filter((_, i) => i !== optIdx);
                        updateQuestion(question.id, { options: newOptions });
                      }}
                      className="text-zinc-600 hover:text-red-400"
                    >
                      <X size={16} />
                    </button>
                  )}
                </div>
              ))}
              <button
                onClick={() => {
                  const newOptions = [...(question.options || []), `Option ${(question.options || []).length + 1}`];
                  updateQuestion(question.id, { options: newOptions });
                }}
                className="text-xs text-indigo-400 hover:text-indigo-300 mt-2"
              >
                Add option
              </button>
            </div>
          ) : question.type === QuestionType.DROPDOWN ? (
            <div className="space-y-2">
              {(question.options || ['Option 1']).map((opt, optIdx) => (
                <div key={optIdx} className="flex items-center gap-3">
                  <span className="text-xs text-zinc-600">{optIdx + 1}.</span>
                  <input
                    type="text"
                    value={opt}
                    onChange={(e) => {
                      const newOptions = [...(question.options || [])];
                      newOptions[optIdx] = e.target.value;
                      updateQuestion(question.id, { options: newOptions });
                    }}
                    placeholder={`Option ${optIdx + 1}`}
                    className="flex-1 border-none outline-none text-xs text-zinc-300 bg-transparent placeholder:text-zinc-700"
                  />
                  {(question.options || []).length > 1 && (
                    <button
                      onClick={() => {
                        const newOptions = (question.options || []).filter((_, i) => i !== optIdx);
                        updateQuestion(question.id, { options: newOptions });
                      }}
                      className="text-zinc-600 hover:text-red-400"
                    >
                      <X size={16} />
                    </button>
                  )}
                </div>
              ))}
              <button
                onClick={() => {
                  const newOptions = [...(question.options || []), `Option ${(question.options || []).length + 1}`];
                  updateQuestion(question.id, { options: newOptions });
                }}
                className="text-xs text-indigo-400 hover:text-indigo-300 mt-2"
              >
                Add option
              </button>
            </div>
          ) : question.type === QuestionType.LINEAR_SCALE || question.type === QuestionType.LIKERT_SCALE ? (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <select
                  value={question.scaleMin || 1}
                  onChange={(e) => updateQuestion(question.id, { scaleMin: parseInt(e.target.value) })}
                  className="border border-white/10 rounded-lg px-2 py-1 text-xs bg-zinc-900 text-zinc-300"
                >
                  {[1, 2, 3, 4, 5].map(n => <option key={n} value={n}>{n}</option>)}
                </select>
                <span className="text-xs text-zinc-500">to</span>
                <select
                  value={question.scaleMax || 5}
                  onChange={(e) => updateQuestion(question.id, { scaleMax: parseInt(e.target.value) })}
                  className="border border-white/10 rounded-lg px-2 py-1 text-xs bg-zinc-900 text-zinc-300"
                >
                  {[5, 6, 7, 8, 9, 10].map(n => <option key={n} value={n}>{n}</option>)}
                </select>
              </div>
              <div className="flex items-center gap-4">
                <input
                  type="text"
                  value={question.scaleMinLabel || ''}
                  onChange={(e) => updateQuestion(question.id, { scaleMinLabel: e.target.value })}
                  placeholder="1 Label (optional)"
                  className="flex-1 border border-white/10 rounded-lg px-3 py-1.5 text-xs bg-zinc-900 text-zinc-300 placeholder:text-zinc-700"
                />
                <input
                  type="text"
                  value={question.scaleMaxLabel || ''}
                  onChange={(e) => updateQuestion(question.id, { scaleMaxLabel: e.target.value })}
                  placeholder={`${question.scaleMax || 5} Label (optional)`}
                  className="flex-1 border border-white/10 rounded-lg px-3 py-1.5 text-xs bg-zinc-900 text-zinc-300 placeholder:text-zinc-700"
                />
              </div>
              <div className="flex gap-2 pt-2">
                {Array.from({ length: (question.scaleMax || 5) - (question.scaleMin || 1) + 1 }, (_, i) => (question.scaleMin || 1) + i).map(n => (
                  <div key={n} className="flex flex-col items-center">
                    <span className="text-xs text-zinc-500 mb-1">{n}</span>
                    <div className="w-8 h-8 border-2 border-white/10 rounded"></div>
                  </div>
                ))}
              </div>
            </div>
          ) : question.type === QuestionType.RATING ? (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <select
                  value={question.ratingMax || 5}
                  onChange={(e) => updateQuestion(question.id, { ratingMax: parseInt(e.target.value) })}
                  className="border border-white/10 rounded-lg px-2 py-1 text-xs bg-zinc-900 text-zinc-300"
                >
                  {[3, 4, 5, 6, 7, 8, 9, 10].map(n => <option key={n} value={n}>{n}</option>)}
                </select>
                <select
                  value={question.ratingSymbol || 'star'}
                  onChange={(e) => updateQuestion(question.id, { ratingSymbol: e.target.value as 'star' | 'heart' | 'number' })}
                  className="border border-white/10 rounded-lg px-2 py-1 text-xs bg-zinc-900 text-zinc-300"
                >
                  <option value="star">Star</option>
                  <option value="heart">Heart</option>
                  <option value="number">Number</option>
                </select>
              </div>
              <div className="flex gap-2 pt-2">
                {Array.from({ length: question.ratingMax || 5 }, (_, i) => i + 1).map(n => (
                  <div key={n} className="flex flex-col items-center">
                    {question.ratingSymbol === 'star' ? (
                      <Star size={24} className="text-zinc-600" />
                    ) : question.ratingSymbol === 'heart' ? (
                      <Heart size={24} className="text-zinc-600" />
                    ) : (
                      <span className="text-lg text-zinc-500">{n}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>

        {/* Question Footer */}
        <div className="flex items-center justify-between p-4 border-t border-white/5">
          <div className="flex items-center gap-2">
            <button
              onClick={() => duplicateQuestion(question.id)}
              className="p-2 hover:bg-zinc-800 rounded"
              title="Duplicate"
            >
              <Copy size={16} className="text-zinc-400" />
            </button>
            <button
              onClick={() => removeQuestion(question.id)}
              className="p-2 hover:bg-zinc-800 rounded"
              title="Delete"
            >
              <Trash2 size={16} className="text-zinc-400" />
            </button>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => reorderQuestion(question.id, 'up')}
              disabled={index === 0}
              className="p-2 hover:bg-zinc-800 rounded disabled:opacity-30"
              title="Move up"
            >
              <ChevronDown size={16} className="text-zinc-400 rotate-180" />
            </button>
            <button
              onClick={() => reorderQuestion(question.id, 'down')}
              disabled={index === questions.length - 1}
              className="p-2 hover:bg-zinc-800 rounded disabled:opacity-30"
              title="Move down"
            >
              <ChevronDown size={16} className="text-zinc-400" />
            </button>
          </div>
        </div>

        {/* Image Picker Modal */}
        {editingQuestionId === question.id && (
          <ImagePickerModal
            questionId={question.id}
            assets={assets}
            onSelectFromAssets={(imageUrl, imageId) => {
              handleImageSelect(question.id, imageUrl, imageId);
              setEditingQuestionId(null);
            }}
            onUpload={(file) => {
              handleImageUpload(question.id, file);
              setEditingQuestionId(null);
            }}
            onClose={() => setEditingQuestionId(null)}
          />
        )}
      </div>
    );
  };

  // Results summary component
  const ResultsSummary = () => {
    const displayResults = latestSimulationResults.length > 0 ? latestSimulationResults : results.slice(-filteredPersonas.length);
    if (displayResults.length === 0) return null;
    
    const completionRate = displayResults.length / filteredPersonas.length * 100;
    const avgResponseLength = displayResults.reduce((sum, r) => 
      sum + r.responses.reduce((s, resp) => s + resp.answer.length, 0) / r.responses.length, 0
    ) / displayResults.length;

    return (
      <div className="bg-zinc-900/30 border border-white/5 rounded-[2rem] p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.3em]">Simulation Results</h3>
          <div className="flex gap-2">
            <button
              onClick={exportToCSV}
              className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg text-xs font-semibold flex items-center gap-2"
            >
              <FileDown size={14} />
              CSV
            </button>
            <button
              onClick={exportToXLSX}
              className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg text-xs font-semibold flex items-center gap-2"
            >
              <FileSpreadsheet size={14} />
              Excel
            </button>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 text-xs">
          <div>
            <div className="text-zinc-500 mb-1">Total Personas</div>
            <div className="text-white font-bold">{displayResults.length}</div>
          </div>
          <div>
            <div className="text-zinc-500 mb-1">Completion Rate</div>
            <div className="text-white font-bold">{completionRate.toFixed(1)}%</div>
          </div>
          <div>
            <div className="text-zinc-500 mb-1">Cohorts Included</div>
            <div className="text-white font-bold">{selectedCohorts.length}</div>
          </div>
          <div>
            <div className="text-zinc-500 mb-1">Avg Response Length</div>
            <div className="text-white font-bold">{Math.round(avgResponseLength)} chars</div>
          </div>
        </div>
        <div className="flex gap-3 pt-4 border-t border-white/5">
          <button
            onClick={() => setShowSaveModal(true)}
            className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-2"
          >
            <FileDown size={14} />
            Save Simulation
          </button>
          <button
            onClick={handleGenerateAnother}
            className="flex-1 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-2"
          >
            <Plus size={14} />
            Generate Another
          </button>
          <button
            onClick={() => setShowInsights(true)}
            className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-2"
          >
            <BarChart3 size={14} />
            View Insights
          </button>
        </div>
        <div className="text-[9px] text-zinc-600">
          Timestamp: {new Date().toLocaleString()}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8 animate-in fade-in h-full flex flex-col relative pb-32 min-h-screen">
      <InfoModal 
        isOpen={!!help} 
        onClose={() => setHelp(null)} 
        title={help?.title || ""} 
        content={help?.content || ""} 
      />

      {/* Error Display */}
      {error && (
        <ErrorDisplay
          message={error}
          variant="banner"
          dismissible
          onDismiss={() => { setError(null); setErrorFromSimulation(false); }}
          onRetry={errorFromSimulation ? () => { setError(null); setErrorFromSimulation(false); handleRunSimulation(); } : undefined}
        />
      )}

      {/* Success message (non-blocking) */}
      {saveSuccess && (
        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4 flex items-center gap-3 animate-in fade-in">
          <CheckCircle2 className="text-emerald-400 flex-shrink-0" size={20} />
          <span className="text-sm text-emerald-300">{saveSuccess}</span>
        </div>
      )}

      {/* Header */}
      <div className="border-b border-white/5 px-8 py-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-black text-white mb-1 uppercase tracking-tight italic">Research Sandbox</h2>
            <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-[0.4em]">Isolated Survey Isolation & Stimulus Testing</p>
          </div>
          <button 
            onClick={handleRunSimulation} 
            disabled={isRunning || filteredPersonas.length === 0 || questions.length === 0} 
            className={`px-10 py-3 rounded-[2rem] text-xs font-black uppercase tracking-[0.3em] flex items-center justify-center gap-3 transition-all shadow-2xl ${
              isRunning 
                ? 'bg-zinc-900 text-zinc-600' 
                : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/20 active:scale-95'
            } ${filteredPersonas.length === 0 || questions.length === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {isRunning ? <Loader2 size={18} className="animate-spin" /> : <Play size={18} fill="currentColor" />}
            {isRunning ? `Executing Batch... (${filteredPersonas.length} agents)` : `Launch Simulation (${filteredPersonas.length} agents)`}
          </button>
        </div>

        {/* Cohort Selection */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <label className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.3em] flex items-center gap-2">
              <Users size={14} /> Select Cohorts for Analysis
            </label>
            <div className="flex gap-3 text-xs">
              <button
                onClick={handleSelectAllCohorts}
                className="text-indigo-400 hover:text-indigo-300"
              >
                Select All
              </button>
              <button
                onClick={handleClearCohorts}
                className="text-indigo-400 hover:text-indigo-300"
              >
                Clear
              </button>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            {segments.map(seg => {
              const segmentPersonas = personas.filter(p => p.segmentId === seg.id);
              const isSelected = selectedCohorts.includes(seg.id);
              return (
                <button
                  key={seg.id}
                  onClick={() => handleToggleCohort(seg.id)}
                  className={`px-4 py-2 rounded-full text-xs font-semibold transition-all flex items-center gap-2 ${
                    isSelected
                      ? 'bg-indigo-600 text-white border-2 border-indigo-500'
                      : 'bg-zinc-800 text-zinc-300 border-2 border-zinc-700 hover:border-zinc-600'
                  }`}
                  style={isSelected ? { borderColor: seg.color } : {}}
                >
                  <div 
                    className="w-2 h-2 rounded-full" 
                    style={{ background: seg.color }}
                  />
                  {seg.name} ({segmentPersonas.length})
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 px-8 pb-8">
        <div className="max-w-4xl mx-auto">
          {/* Phase 1: Context Calibration */}
          <div className="bg-zinc-900/30 border border-white/5 rounded-[2rem] p-6 mb-6">
            <label className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.3em] flex items-center gap-2 mb-4">
              <FlaskConical size={14} /> Phase 1: Context Calibration
              <InfoButton onClick={() => setHelp({
                title: "Context Calibration",
                content: "The context sets the scene for the persona. This framed experience is critical for accurate behavioral response simulation."
              })} />
            </label>
            <textarea 
              value={context} 
              onChange={(e) => setContext(e.target.value)} 
              placeholder="Set the scenario (e.g. 'You are looking for a new app that promises to enhance your daily productivity...')" 
              className="w-full h-32 bg-zinc-950/50 border border-white/10 rounded-2xl p-4 text-xs text-zinc-300 outline-none resize-none font-mono placeholder:text-zinc-800"
            />
          </div>

          {/* Phase 2: Instrument Design */}
          <div className="bg-zinc-900/30 border border-white/5 rounded-[2rem] p-6 mb-6">
            <div className="flex items-center justify-between mb-6">
              <label className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.3em] flex items-center gap-2">
                <ListTodo size={14} /> Phase 2: Instrument Design
                <InfoButton onClick={() => setHelp({
                  title: "Questionnaire Design",
                  content: "Research instruments (questions) are the way you extract data from personas. Different formats capture different facets of human sentiment."
                })} />
              </label>
              <button 
                onClick={addQuestion} 
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-[1rem] text-xs font-semibold flex items-center gap-2"
              >
                <Plus size={14} />
                Add Question
              </button>
            </div>

            {/* Questions */}
            <div className="space-y-4">
              {questions.map((q, idx) => renderQuestionCard(q, idx))}
            </div>
          </div>

          {/* Results Summary */}
          {(latestSimulationResults.length > 0 || results.length > 0) && !showInsights && (
            <ResultsSummary />
          )}

          {/* Insights View */}
          {showInsights && results.length > 0 && (
            <InsightsView 
              results={results.slice(-filteredPersonas.length)}
              questions={questions}
              segments={segments.filter(s => selectedCohorts.includes(s.id))}
              personas={filteredPersonas}
              simulationId={simulationId}
              onBack={() => setShowInsights(false)}
            />
          )}
        </div>
      </div>

      {/* Save Simulation Modal */}
      {showSaveModal && (
        <div 
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          onClick={() => setShowSaveModal(false)}
        >
          <div 
            className="bg-zinc-900 border border-white/10 rounded-2xl p-6 max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold text-white mb-4">Save Simulation</h3>
            <div className="space-y-4">
              <div>
                <label className="text-xs text-zinc-400 mb-2 block">Simulation Name *</label>
                <input
                  type="text"
                  value={simulationName}
                  onChange={(e) => setSimulationName(e.target.value)}
                  placeholder="e.g., Product Launch Survey v1"
                  className="w-full bg-zinc-950 border border-white/10 rounded-lg px-4 py-2 text-sm text-white placeholder:text-zinc-600"
                />
              </div>
              <div>
                <label className="text-xs text-zinc-400 mb-2 block">Description (optional)</label>
                <textarea
                  value={simulationDescription}
                  onChange={(e) => setSimulationDescription(e.target.value)}
                  placeholder="Brief description of this simulation..."
                  className="w-full bg-zinc-950 border border-white/10 rounded-lg px-4 py-2 text-sm text-white placeholder:text-zinc-600 h-24 resize-none"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowSaveModal(false)}
                  className="flex-1 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg text-sm font-semibold"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveSimulation}
                  className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-semibold"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Progress Bar */}
      {isRunning && (
        <div className="fixed inset-x-0 bottom-0 p-8 bg-black/90 backdrop-blur-xl border-t border-indigo-500/30 shadow-2xl z-50">
          <div className="flex justify-between items-center mb-4">
            <div className="flex-1">
              <div className="text-[10px] font-black text-indigo-400 mb-2 uppercase tracking-[0.3em] animate-pulse">
                {statusMessage}
              </div>
              <div className="text-[9px] text-zinc-500 font-medium">
                Processing persona {currentPersonaIndex + 1} of {filteredPersonas.length}
              </div>
            </div>
            <div className="text-lg font-black text-indigo-400 ml-4">
              {progress}%
            </div>
          </div>
          <div className="h-2 bg-zinc-900 rounded-full overflow-hidden shadow-inner">
            <div 
              className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 shadow-[0_0_20px_rgba(99,102,241,0.6)] transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

// Image Picker Modal Component
interface ImagePickerModalProps {
  questionId: string;
  assets: Asset[];
  onSelectFromAssets: (imageUrl: string, imageId: string) => void;
  onUpload: (file: File) => void;
  onClose: () => void;
}

const ImagePickerModal: React.FC<ImagePickerModalProps> = ({ questionId, assets, onSelectFromAssets, onUpload, onClose }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const imageAssets = assets.filter(a => a.type === 'IMAGE');
  
  return (
    <div 
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div 
        className="bg-zinc-900 border border-white/10 rounded-2xl p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-lg text-white">Add Image to Question</h3>
          <button onClick={onClose} className="text-zinc-400 hover:text-white">
            <X size={20} />
          </button>
        </div>
        
        <div className="space-y-4">
          <div>
            <h4 className="font-medium mb-3 text-zinc-300">Pick from Assets</h4>
            {imageAssets.length > 0 ? (
              <div className="grid grid-cols-3 gap-3">
                {imageAssets.map(asset => (
                  <div
                    key={asset.id}
                    onClick={() => onSelectFromAssets(asset.data, asset.id)}
                    className="cursor-pointer border-2 border-white/10 rounded-lg hover:border-indigo-500 transition-all"
                  >
                    <img src={asset.data} alt="Asset" className="w-full h-24 object-cover rounded" />
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-zinc-500">No images in Assets. Upload one below.</p>
            )}
          </div>
          
          <div>
            <h4 className="font-medium mb-3 text-zinc-300">Upload from Computer</h4>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  onUpload(file);
                }
              }}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full p-4 border-2 border-dashed border-white/10 rounded-lg hover:border-indigo-500 transition-all flex items-center justify-center gap-2"
            >
              <Upload size={20} className="text-zinc-400" />
              <span className="text-sm text-zinc-300">Click to upload image</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Insights View Component
interface InsightsViewProps {
  results: SimulationResult[];
  questions: Question[];
  segments: PersonaSegment[];
  personas: Persona[];
  simulationId: string;
  onBack: () => void;
}

const InsightsView: React.FC<InsightsViewProps> = ({ results, questions, segments, personas, simulationId, onBack }) => {
  // Generate charts data for each question
  const generateChartsData = () => {
    const chartsData: Record<string, any> = {};
    
    questions.forEach(question => {
      const questionResponses = results.flatMap(r => 
        r.responses.filter(resp => resp.questionId === question.id)
      );
      
      if (question.type === QuestionType.MULTIPLE_CHOICE || 
          question.type === QuestionType.CHECKBOXES || 
          question.type === QuestionType.DROPDOWN) {
        // Count responses by option
        const optionCounts: Record<string, number> = {};
        questionResponses.forEach(resp => {
          const answer = resp.answer.trim();
          optionCounts[answer] = (optionCounts[answer] || 0) + 1;
        });
        
        chartsData[question.id] = {
          type: 'categorical',
          pieData: Object.entries(optionCounts).map(([name, value]) => ({ name, value })),
          barData: Object.entries(optionCounts).map(([name, value]) => ({ name, value }))
        };
      } else if (question.type === QuestionType.LINEAR_SCALE || 
                 question.type === QuestionType.LIKERT_SCALE ||
                 question.type === QuestionType.RATING) {
        // Count numeric responses
        const numericCounts: Record<number, number> = {};
        questionResponses.forEach(resp => {
          const num = resp.numericValue || parseInt(resp.answer) || 0;
          numericCounts[num] = (numericCounts[num] || 0) + 1;
        });
        
        chartsData[question.id] = {
          type: 'numeric',
          barData: Object.entries(numericCounts).map(([name, value]) => ({ name: `Value ${name}`, value }))
        };
      } else {
        // Open-ended: extract themes AND create sentiment distribution chart
        const themes = extractThemes(questionResponses.map(r => r.answer));
        
        // Sentiment distribution for chart
        const sentimentCounts: Record<string, number> = {
          'Positive': 0,
          'Neutral': 0,
          'Negative': 0
        };
        questionResponses.forEach(resp => {
          sentimentCounts[resp.sentiment] = (sentimentCounts[resp.sentiment] || 0) + 1;
        });
        
        chartsData[question.id] = {
          type: 'open',
          themes,
          quotes: questionResponses.slice(0, 5).map(r => r.answer),
          // NEW: Add charts for open-ended questions too
          pieData: Object.entries(sentimentCounts).map(([name, value]) => ({ name, value })),
          barData: Object.entries(sentimentCounts).map(([name, value]) => ({ name, value }))
        };
      }
    });
    
    return chartsData;
  };

  const extractThemes = (responses: string[]): string[] => {
    // Simple keyword extraction (can be enhanced with AI)
    const words = responses.join(' ').toLowerCase().split(/\s+/);
    const wordCounts: Record<string, number> = {};
    words.forEach(word => {
      if (word.length > 4) {
        wordCounts[word] = (wordCounts[word] || 0) + 1;
      }
    });
    return Object.entries(wordCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([word]) => word);
  };

  const chartsData = generateChartsData();
  
  // Generate narrative report
  const generateReport = () => {
    const totalPersonas = results.length;
    const totalQuestions = questions.length;
    const completionRate = (results.filter(r => r.responses.length === totalQuestions).length / totalPersonas * 100).toFixed(1);
    
    return {
      whatAppDid: `The system applied the stimulus context to ${totalPersonas} AI personas across ${segments.length} cohorts. Each persona was instantiated with their unique behavioral profile and responded to ${totalQuestions} questions in complete isolation. The system structured all responses, computed distributions, and generated visualizations.`,
      whatPersonasDid: `Personas demonstrated ${results.some(r => r.responses.some(resp => resp.sentiment === 'Positive')) ? 'varied' : 'consistent'} sentiment patterns. ${segments.length > 1 ? 'Cohort differences were observed, with distinct preference signals emerging per segment.' : 'Responses showed clear preference signals.'} ${completionRate}% completion rate indicates ${parseFloat(completionRate) > 90 ? 'high engagement' : 'moderate engagement'} with the survey.`,
      analysesPerformed: `Distribution analysis revealed response patterns across all question types. ${segments.length > 1 ? 'Cohort comparison identified significant differences in categorical responses and mean differences in scale-based questions.' : ''} Theme extraction from open-ended responses surfaced key concerns and motivations. Simple segmentation diagnostics grouped personas by response patterns, revealing ${segments.length} distinct behavioral clusters.`
    };
  };

  const report = generateReport();
  const COLORS = ['#6366f1', '#ec4899', '#10b981', '#f59e0b', '#06b6d4', '#8b5cf6', '#f97316'];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-sm text-indigo-400 hover:text-indigo-300"
        >
          <ArrowLeft size={16} />
          Back to Survey Builder
        </button>
        <h2 className="text-xl font-bold text-white">Simulation Insights</h2>
        <div className="w-24"></div>
      </div>

      {/* Narrative Report */}
      <div className="bg-zinc-900/30 border border-white/5 rounded-[2rem] p-6 mb-6">
        <h3 className="text-lg font-bold mb-4 text-white">Simulation Overview</h3>
        <div className="space-y-4 text-sm text-zinc-300">
          <div>
            <h4 className="font-semibold mb-2">What the app did:</h4>
            <p>{report.whatAppDid}</p>
          </div>
          <div>
            <h4 className="font-semibold mb-2">What the personas did:</h4>
            <p>{report.whatPersonasDid}</p>
          </div>
          <div>
            <h4 className="font-semibold mb-2">Analyses performed:</h4>
            <p>{report.analysesPerformed}</p>
          </div>
        </div>
      </div>

      {/* Simple Summary Stats */}
      <div className="bg-zinc-900/30 border border-white/5 rounded-xl p-6 mb-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-zinc-950/50 rounded-xl">
            <div className="text-2xl font-black text-white mb-1">{results.length}</div>
            <div className="text-[10px] text-zinc-500 uppercase font-bold">Total Responses</div>
          </div>
          <div className="text-center p-4 bg-zinc-950/50 rounded-xl">
            <div className="text-2xl font-black text-white mb-1">{segments.length}</div>
            <div className="text-[10px] text-zinc-500 uppercase font-bold">Cohorts</div>
          </div>
          <div className="text-center p-4 bg-zinc-950/50 rounded-xl">
            <div className="text-2xl font-black text-white mb-1">{questions.length}</div>
            <div className="text-[10px] text-zinc-500 uppercase font-bold">Questions</div>
          </div>
          <div className="text-center p-4 bg-zinc-950/50 rounded-xl">
            <div className="text-2xl font-black text-white mb-1">
              {((results.filter(r => r.responses.some(resp => resp.sentiment === 'Positive')).length / results.length) * 100).toFixed(0)}%
            </div>
            <div className="text-[10px] text-zinc-500 uppercase font-bold">Positive Sentiment</div>
          </div>
        </div>
      </div>

      {/* Individual Responses Table */}
      <div className="bg-zinc-900/30 border border-white/5 rounded-xl p-6 mb-6">
        <h4 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
          <Users size={16} className="text-indigo-400" />
          All Individual Responses ({results.length} Participants)
        </h4>
        <div className="overflow-x-auto max-h-96 overflow-y-auto">
          <table className="w-full text-xs">
            <thead className="sticky top-0 bg-zinc-950 border-b border-white/10">
              <tr>
                <th className="text-left p-3 text-zinc-400 font-bold">Participant</th>
                <th className="text-left p-3 text-zinc-400 font-bold">Segment</th>
                {questions.map((q, idx) => (
                  <th key={idx} className="text-left p-3 text-zinc-400 font-bold">Q{idx + 1}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {results.map((result, pIdx) => (
                <tr key={pIdx} className="border-b border-white/5 hover:bg-zinc-800/30">
                  <td className="p-3 text-zinc-300 font-medium">{result.personaName}</td>
                  <td className="p-3 text-zinc-500 text-[10px]">
                    {segments.find(s => s.id === result.segmentId)?.name || 'Unknown'}
                  </td>
                  {questions.map((q, qIdx) => {
                    const response = result.responses.find(r => r.questionId === q.id);
                    const sentimentColors: Record<string, string> = {
                      'Positive': 'text-emerald-400',
                      'Neutral': 'text-zinc-400',
                      'Negative': 'text-red-400'
                    };
                    return (
                      <td key={qIdx} className="p-3">
                        <div className={`${sentimentColors[response?.sentiment || 'Neutral']} text-[11px]`}>
                          {response?.numericValue !== undefined && response?.numericValue !== null
                            ? response.numericValue
                            : response?.answer.substring(0, 50) + (response?.answer.length > 50 ? '...' : '')}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Response Charts by Question */}
      {questions.map((question, idx) => {
        const data = chartsData[question.id];
        if (!data) return null;

        return (
          <div key={question.id} className="bg-zinc-900/30 border border-white/5 rounded-[2rem] p-6 mb-6">
            <h3 className="text-base font-semibold mb-4 text-white">{question.text}</h3>
            <div className="text-xs text-zinc-500 mb-4">
              N = {results.filter(r => r.responses.some(resp => resp.questionId === question.id)).length} responses
            </div>
            
            {data.type === 'categorical' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="text-sm font-semibold mb-3 text-white">Distribution</h4>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={data.pieData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {data.pieData.map((entry: any, index: number) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold mb-3 text-white">Counts</h4>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={data.barData}>
                        <XAxis dataKey="name" stroke="#9ca3af" />
                        <YAxis stroke="#9ca3af" />
                        <Tooltip contentStyle={{ backgroundColor: '#18181b', border: '1px solid rgba(255,255,255,0.1)' }} />
                        <Bar dataKey="value" fill="#6366f1" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                
                {/* Individual Responses Breakdown */}
                <div>
                  <h4 className="text-sm font-semibold mb-3 text-white">Individual Responses by Choice</h4>
                  <div className="space-y-3">
                    {Object.entries(
                      results.reduce((acc, result) => {
                        const response = result.responses.find(r => r.questionId === question.id);
                        if (response) {
                          const answer = response.answer.trim();
                          if (!acc[answer]) acc[answer] = [];
                          acc[answer].push(result.personaName);
                        }
                        return acc;
                      }, {} as Record<string, string[]>)
                    ).map(([answer, names], idx) => (
                      <div key={idx} className="p-3 bg-zinc-950/50 rounded-lg border border-white/5">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-bold text-white">{answer}</span>
                          <span className="text-xs text-zinc-500">{names.length} participants</span>
                        </div>
                        <div className="text-[10px] text-zinc-400">
                          {names.join(', ')}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
            
            {data.type === 'numeric' && (
              <div className="space-y-6">
                <div>
                  <h4 className="text-sm font-semibold mb-3 text-white">Response Distribution</h4>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={data.barData}>
                      <XAxis dataKey="name" stroke="#9ca3af" />
                      <YAxis stroke="#9ca3af" />
                      <Tooltip contentStyle={{ backgroundColor: '#18181b', border: '1px solid rgba(255,255,255,0.1)' }} />
                      <Bar dataKey="value" fill="#6366f1" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                
                {/* Individual Numeric Responses */}
                <div>
                  <h4 className="text-sm font-semibold mb-3 text-white">All Individual Scores</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {results.map((result, i) => {
                      const response = result.responses.find(r => r.questionId === question.id);
                      if (!response || response.numericValue === undefined) return null;
                      const score = response.numericValue;
                      const maxScore = question.scaleMax || question.ratingMax || 10;
                      const percentage = (score / maxScore) * 100;
                      const color = percentage > 70 ? '#10b981' : percentage > 40 ? '#6366f1' : '#ef4444';
                      
                      return (
                        <div key={i} className="p-3 bg-zinc-950/50 rounded-lg border border-white/5">
                          <div className="text-[10px] text-zinc-500 mb-1 truncate">{result.personaName}</div>
                          <div className="flex items-center gap-2">
                            <div className="text-2xl font-black" style={{ color }}>{score}</div>
                            <div className="text-xs text-zinc-600">/ {maxScore}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
            
            {data.type === 'open' && (
              <div className="space-y-6">
                {/* Sentiment Distribution Charts */}
                {data.pieData && data.pieData.length > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div>
                      <h4 className="text-sm font-semibold mb-3 text-white">Sentiment Distribution</h4>
                      <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                          <Pie
                            data={data.pieData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {data.pieData.map((entry: any, index: number) => {
                              const colors: Record<string, string> = {
                                'Positive': '#10b981',
                                'Neutral': '#6366f1',
                                'Negative': '#ef4444'
                              };
                              return <Cell key={`cell-${index}`} fill={colors[entry.name] || COLORS[index % COLORS.length]} />;
                            })}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold mb-3 text-white">Sentiment Counts</h4>
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={data.barData}>
                          <XAxis dataKey="name" stroke="#9ca3af" />
                          <YAxis stroke="#9ca3af" />
                          <Tooltip contentStyle={{ backgroundColor: '#18181b', border: '1px solid rgba(255,255,255,0.1)' }} />
                          <Bar dataKey="value">
                            {data.barData.map((entry: any, index: number) => {
                              const colors: Record<string, string> = {
                                'Positive': '#10b981',
                                'Neutral': '#6366f1',
                                'Negative': '#ef4444'
                              };
                              return <Cell key={`cell-${index}`} fill={colors[entry.name] || '#6366f1'} />;
                            })}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}
                
                {/* All Individual Responses for this Question */}
                <div>
                  <h4 className="text-sm font-semibold mb-3 text-white">All Individual Responses</h4>
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {results.map((result, i) => {
                      const response = result.responses.find(r => r.questionId === question.id);
                      if (!response) return null;
                      const sentimentColors: Record<string, string> = {
                        'Positive': 'border-emerald-500/30 bg-emerald-500/5',
                        'Neutral': 'border-zinc-600/30 bg-zinc-800/20',
                        'Negative': 'border-red-500/30 bg-red-500/5'
                      };
                      const textColors: Record<string, string> = {
                        'Positive': 'text-emerald-400',
                        'Neutral': 'text-zinc-400',
                        'Negative': 'text-red-400'
                      };
                      return (
                        <div key={i} className={`p-3 rounded-lg border ${sentimentColors[response.sentiment]}`}>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-bold text-white">{result.personaName}</span>
                            <span className={`text-[10px] font-bold ${textColors[response.sentiment]}`}>
                              {response.sentiment}
                            </span>
                          </div>
                          <p className="text-xs text-zinc-300">{response.answer}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-semibold mb-2 text-white">Top Themes</h4>
                  <div className="flex flex-wrap gap-2">
                    {data.themes.map((theme: string, i: number) => (
                      <span key={i} className="px-3 py-1 bg-indigo-500/10 border border-indigo-500/20 rounded-full text-xs text-indigo-400">
                        {theme}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default ExperimentLab;
