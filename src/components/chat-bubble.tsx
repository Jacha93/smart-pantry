'use client';

import { useState, useEffect, useRef } from 'react';
import { MessageCircle, X, Send, Bot, User, Plus, LogIn, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useI18n } from '@/hooks/use-i18n';
import { chatAPI } from '@/lib/api';
import { auth, authDisabled } from '@/lib/auth';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface Message {
  id: string;
  role: 'user' | 'bot';
  content: string;
  timestamp: Date;
}

interface QuickAction {
  label: string;
  action: string;
}

export function ChatBubble() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isSubmittingIssue, setIsSubmittingIssue] = useState(false);
  const [showWelcomeAnimation, setShowWelcomeAnimation] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [hasUserMessages, setHasUserMessages] = useState(false); // Track ob User schon Nachrichten gesendet hat
  const [isWaitingForIssueDescription, setIsWaitingForIssueDescription] = useState(false); // Track ob wir auf Issue-Beschreibung warten
  const [isAuthenticated, setIsAuthenticated] = useState(false); // Auth-Status
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatWindowRef = useRef<HTMLDivElement>(null);
  const welcomeSentRef = useRef(false); // Ref um zu tracken ob Welcome-Messages bereits gesendet wurden
  const timeoutRefs = useRef<NodeJS.Timeout[]>([]); // Ref für alle Timeouts zum Aufräumen
  const { t, locale } = useI18n();

  // Prüfe Auth-Status
  useEffect(() => {
    const checkAuth = () => {
      setIsAuthenticated(authDisabled || auth.isAuthenticated());
    };
    checkAuth();
    window.addEventListener('authchange', checkAuth);
    return () => window.removeEventListener('authchange', checkAuth);
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Nur Begrüßung zeigen wenn Chat leer ist (neuer Chat oder erste Öffnung)
    // UND Welcome-Messages noch nicht gesendet wurden
    if (isOpen && messages.length === 0 && !hasUserMessages && !welcomeSentRef.current) {
      welcomeSentRef.current = true; // Markiere als gesendet
      
      // Starte Typing-Animation nach kurzer Verzögerung
      setIsTyping(true);
      setShowWelcomeAnimation(true);
      
      // Räume alle vorherigen Timeouts auf
      timeoutRefs.current.forEach(timeout => clearTimeout(timeout));
      timeoutRefs.current = [];
      
      // Simuliere Typing-Zeit
      const typingTimeout = setTimeout(() => {
        setIsTyping(false);
        // Erste Nachricht: Begrüßung (unterschiedlich je nach Auth-Status)
        const welcomeMessage1: Message = {
          id: 'welcome-1',
          role: 'bot',
          content: isAuthenticated
            ? t('chat.initialMessage')
            : t('chat.initialMessageGuest'),
          timestamp: new Date(),
        };
        setMessages([welcomeMessage1]);
        
        // Zweite Nachricht: Hilfe-Bereiche (unterschiedlich je nach Auth-Status)
        const timeout2 = setTimeout(() => {
          const welcomeMessage2: Message = {
            id: 'welcome-2',
            role: 'bot',
            content: isAuthenticated
              ? t('chat.helpMessage')
              : t('chat.helpMessageGuest'),
            timestamp: new Date(),
          };
          setMessages(prev => [...prev, welcomeMessage2]);
          
          // Dritte Nachricht: Call-to-Action
          const timeout3 = setTimeout(() => {
            const welcomeMessage3: Message = {
              id: 'welcome-3',
              role: 'bot',
              content: t('chat.actionMessage'),
              timestamp: new Date(),
            };
            setMessages(prev => [...prev, welcomeMessage3]);
            setShowWelcomeAnimation(false);
          }, 800);
          timeoutRefs.current.push(timeout3);
        }, 600);
        timeoutRefs.current.push(timeout2);
      }, 1500); // Typing-Animation für 1.5 Sekunden
      
      timeoutRefs.current.push(typingTimeout);

      return () => {
        // Räume alle Timeouts auf
        timeoutRefs.current.forEach(timeout => clearTimeout(timeout));
        timeoutRefs.current = [];
      };
    }
  }, [isOpen, locale, hasUserMessages, isAuthenticated, t]); // Auth-Status als Dependency

  // Schließen ohne Reset (Chat-Verlauf bleibt)
  const handleClose = () => {
    // Räume alle Timeouts auf beim Schließen
    timeoutRefs.current.forEach(timeout => clearTimeout(timeout));
    timeoutRefs.current = [];
    setIsOpen(false);
    setIsAnimating(false);
  };

  // Neuen Chat starten (Reset)
  const handleNewChat = () => {
    // Räume alle Timeouts auf
    timeoutRefs.current.forEach(timeout => clearTimeout(timeout));
    timeoutRefs.current = [];
    
    setMessages([]);
    setInput('');
    setIsTyping(false);
    setShowWelcomeAnimation(false);
    setHasUserMessages(false);
    setIsAnimating(false);
    setIsWaitingForIssueDescription(false);
    welcomeSentRef.current = false; // Reset Welcome-Flag
    
    // Starte Begrüßung erneut
    setIsTyping(true);
    setShowWelcomeAnimation(true);
    const timeout1 = setTimeout(() => {
      setIsTyping(false);
      // Erste Nachricht: Begrüßung (unterschiedlich je nach Auth-Status)
        const welcomeMessage1: Message = {
          id: 'welcome-1',
          role: 'bot',
          content: isAuthenticated
            ? t('chat.initialMessage')
            : t('chat.initialMessageGuest'),
          timestamp: new Date(),
        };
        setMessages([welcomeMessage1]);
        
        // Zweite Nachricht: Hilfe-Bereiche (unterschiedlich je nach Auth-Status)
        const timeout2 = setTimeout(() => {
          const welcomeMessage2: Message = {
            id: 'welcome-2',
            role: 'bot',
            content: isAuthenticated
              ? t('chat.helpMessage')
              : t('chat.helpMessageGuest'),
            timestamp: new Date(),
          };
          setMessages(prev => [...prev, welcomeMessage2]);
        
        // Dritte Nachricht: Call-to-Action
        const timeout3 = setTimeout(() => {
          const welcomeMessage3: Message = {
            id: 'welcome-3',
            role: 'bot',
            content: t('chat.actionMessage'),
            timestamp: new Date(),
          };
          setMessages(prev => [...prev, welcomeMessage3]);
          setShowWelcomeAnimation(false);
        }, 800);
        timeoutRefs.current.push(timeout3);
      }, 600);
      timeoutRefs.current.push(timeout2);
    }, 1500);
    timeoutRefs.current.push(timeout1);
  };

  // Smooth Slide-Up Animation beim Öffnen
  useEffect(() => {
    if (isOpen && chatWindowRef.current) {
      setIsAnimating(true);
      const timer = setTimeout(() => {
        setIsAnimating(false);
      }, 400); // Animation dauert 0.4s
      return () => clearTimeout(timer);
    } else if (!isOpen) {
      setIsAnimating(false);
    }
  }, [isOpen]);

  // Quick Actions unterschiedlich je nach Auth-Status
  const quickActions: QuickAction[] = isAuthenticated
    ? [
        { label: t('chat.action.generalQuestion'), action: 'general_question' },
        { label: t('chat.action.reportIssue'), action: 'report_issue' },
        { label: t('chat.action.groceriesQuestion'), action: 'groceries_question' },
        { label: t('chat.action.recipesQuestion'), action: 'recipes_question' },
      ]
    : [
        { label: t('chat.action.generalQuestion'), action: 'general_question' },
        { label: t('chat.action.reportIssue'), action: 'report_issue' },
        { label: t('chat.action.aboutApp'), action: 'about_app' },
        { label: t('chat.action.signIn'), action: 'sign_in' },
      ];

  const handleQuickAction = (action: string) => {
    if (action === 'report_issue') {
      // Bei Issue-Meldung: Zeige nur die Anweisung, warte auf User-Beschreibung
      setIsWaitingForIssueDescription(true);
      const instructionMessage: Message = {
        id: `instruction-${Date.now()}`,
        role: 'bot',
        content: t('chat.issue.instructions'),
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, instructionMessage]);
      setHasUserMessages(true);
      return;
    }
    
    if (action === 'sign_in') {
      const signInMessage: Message = {
        id: `signin-${Date.now()}`,
        role: 'bot',
        content: t('chat.signInMessage'),
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, signInMessage]);
      setHasUserMessages(true);
      return;
    }
    
    if (action === 'about_app') {
      const aboutMessage: Message = {
        id: `about-${Date.now()}`,
        role: 'bot',
        content: t('chat.aboutMessage'),
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, aboutMessage]);
      setHasUserMessages(true);
      return;
    }
    
    let message = '';
    
    if (action === 'general_question') {
      message = t('chat.question.general');
    } else if (action === 'groceries_question' && isAuthenticated) {
      message = t('chat.question.groceries');
    } else if (action === 'recipes_question' && isAuthenticated) {
      message = t('chat.question.recipes');
    }

    if (message) {
      setInput(message);
      handleSend();
    } else if (action === 'groceries_question' || action === 'recipes_question') {
      // Wenn nicht eingeloggt und versucht auf Lebensmittel/Rezepte zuzugreifen
      const restrictedMessage: Message = {
        id: `restricted-${Date.now()}`,
        role: 'bot',
        content: t('chat.restrictedMessage'),
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, restrictedMessage]);
      setHasUserMessages(true);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isTyping || isSubmittingIssue) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setHasUserMessages(true); // User hat jetzt eine Nachricht gesendet
    setIsTyping(true);

    try {
      // Wenn wir auf Issue-Beschreibung warten, erstelle direkt das Issue
      if (isWaitingForIssueDescription) {
        setIsWaitingForIssueDescription(false);
        await handleIssueReport(userMessage.content);
        setIsTyping(false);
        return;
      }

      // Prüfe ob es eine Issue-Meldung ist (für manuelle Eingabe)
      const isIssueReport = userMessage.content.toLowerCase().includes('issue') || 
                            userMessage.content.toLowerCase().includes('fehler') ||
                            userMessage.content.toLowerCase().includes('bug') ||
                            userMessage.content.toLowerCase().includes('problem');

      if (isIssueReport && !userMessage.content.toLowerCase().includes('ich möchte') && !userMessage.content.toLowerCase().includes('i want')) {
        // User hat manuell ein Issue gemeldet, aber noch keine Beschreibung
        setIsWaitingForIssueDescription(true);
        const instructionMessage: Message = {
          id: `instruction-${Date.now()}`,
          role: 'bot',
          content: t('chat.issue.instructions'),
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, instructionMessage]);
        setIsTyping(false);
        return;
      }

      // Normale Chat-Antwort (mit Auth-Status)
      await handleBotResponse(userMessage.content, isAuthenticated);
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        role: 'bot',
        content: t('chat.errorMessage'),
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleIssueReport = async (description: string) => {
    setIsSubmittingIssue(true);
    
    // Prüfe ob die Beschreibung ausreichend ist
    if (!description || description.trim().length < 10) {
      const errorMsg: Message = {
        id: `issue-error-${Date.now()}`,
        role: 'bot',
        content: t('chat.issue.tooShort'),
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMsg]);
      setIsSubmittingIssue(false);
      return;
    }

    try {
      // Markiere Issue als Gast- oder User-Issue
      const labels = isAuthenticated 
        ? ['bug', 'user-reported'] 
        : ['bug', 'guest-reported'];
      
      const issueTitle = `[${isAuthenticated ? 'User' : 'Guest'}] ${description.substring(0, 50)}${description.length > 50 ? '...' : ''}`;
      
      const issueBody = isAuthenticated
        ? description
        : `${description}\n\n---\n*${t('chat.issue.guestReported')}*`;
      
      const response = await chatAPI.createIssue(
        issueTitle,
        issueBody,
        labels,
        isAuthenticated
      );

      // Handle both html_url and fallback_url responses
      const issueUrl = response.data.data?.html_url || response.data.html_url || response.data.fallback_url;
      
      const successMessage: Message = {
        id: `success-${Date.now()}`,
        role: 'bot',
        content: t('chat.issue.success') + ` ${issueUrl}\n\n` + t('common.thankYou'),
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, successMessage]);
    } catch (error) {
      console.error('Issue creation error:', error);
      
      // Extract fallback URL from error response if available
      const fallbackUrl = (error as { response?: { data?: { fallback_url?: string } } })?.response?.data?.fallback_url 
        || 'https://github.com/Jacha93/smart-pantry/issues/new';
      
      const errorMsg: Message = {
        id: `issue-error-${Date.now()}`,
        role: 'bot',
        content: t('chat.issue.error') + `\n\n${fallbackUrl}\n\n` + t('chat.issue.errorHint'),
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMsg]);
    }
    
    setIsSubmittingIssue(false);
  };

  const handleBotResponse = async (userMessage: string, authenticated: boolean) => {
    try {
      const response = await chatAPI.sendMessage(userMessage, 'smart-pantry', authenticated);

      const botMessage: Message = {
        id: `bot-${Date.now()}`,
        role: 'bot',
        content: response.data.response,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      // Fallback zu lokalen Antworten
      const fallbackResponse = getFallbackResponse(userMessage, authenticated);
      const botMessage: Message = {
        id: `bot-${Date.now()}`,
        role: 'bot',
        content: fallbackResponse,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, botMessage]);
    }
  };

  const getFallbackResponse = (userMessage: string, authenticated: boolean): string => {
    const lowerMessage = userMessage.toLowerCase();
    const isGerman = locale === 'de';

    // Projektbezogene Antworten
    if (lowerMessage.includes('issue') || lowerMessage.includes('fehler') || lowerMessage.includes('bug')) {
      return t('chat.help.issue');
    }

    if (authenticated) {
      // Eingeloggte User: Alle Funktionen
      if (lowerMessage.includes('rezept') || lowerMessage.includes('recipe')) {
        return t('chat.help.recipes');
      }

      if (lowerMessage.includes('lebensmittel') || lowerMessage.includes('grocery') || lowerMessage.includes('inventar')) {
        return t('chat.help.groceries');
      }
    } else {
      // Nicht eingeloggte User: Nur allgemeine Infos + Login-Motivation
      if (lowerMessage.includes('rezept') || lowerMessage.includes('recipe') || 
          lowerMessage.includes('lebensmittel') || lowerMessage.includes('grocery') || 
          lowerMessage.includes('inventar')) {
        return t('chat.restrictedMessage');
      }
    }

    if (lowerMessage.includes('hilfe') || lowerMessage.includes('help')) {
        return authenticated
          ? t('chat.help.general')
          : t('chat.help.generalGuest');
    }

    // Standard-Antwort
    return authenticated
      ? t('chat.help.general')
      : t('chat.help.generalGuest');
  };

  return (
    <>
      {/* Chat Bubble Button mit Badge-Design */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full border border-white/15 bg-[#101014]/90 shadow-[0_14px_38px_rgba(0,0,0,0.42),0_0_0_1px_rgba(23,246,254,0.08)_inset] backdrop-blur-xl transition-all duration-200 hover:-translate-y-0.5 hover:border-[#17f6fe]/35 hover:bg-[#111923] hover:shadow-[0_18px_48px_rgba(0,0,0,0.5),0_0_0_1px_rgba(23,246,254,0.18)_inset]"
          aria-label="Open chat"
        >
          <MessageCircle className="h-6 w-6 text-primary" />
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <Card 
          ref={chatWindowRef}
          className={`fixed bottom-6 right-6 z-50 h-[600px] w-[400px] overflow-hidden border border-white/10 shadow-[0_24px_72px_rgba(0,0,0,0.52)] chat-bubble-container ${isAnimating ? 'chat-bubble-slide-up' : ''}`}
        >
          {/* Wrapper für Hintergrund + Content */}
          <div className="relative h-full w-full">
            {/* Hintergrundbild - nur mittlerer Bereich (Kühlschrank) */}
            <div 
              className="absolute inset-0 z-0 opacity-25"
              style={{
                backgroundImage: 'url(/smart-pantry-banner.jpg)',
                backgroundSize: 'cover',
                backgroundPosition: 'center center',
                backgroundRepeat: 'no-repeat',
              }}
            />
            {/* Overlay für bessere Lesbarkeit - weniger Blur */}
            <div className="absolute inset-0 z-0 bg-black/30" />
          
            {/* Content über Hintergrund */}
            <div className="relative z-10 flex flex-col h-full">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/20 p-4 glass-card bg-white/5">
              <div className="flex items-center space-x-3">
                <Bot className="h-5 w-5 text-primary" />
                <div className="flex flex-col">
                  <h3 className="font-semibold text-foreground">
                    {locale === 'de' ? 'Smart Pantry Assistent' : 'Smart Pantry Assistant'}
                  </h3>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <Sparkles className="h-3 w-3 text-primary" />
                    <span className="text-xs text-muted-foreground">
                      {t('common.aiPowered')}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                {hasUserMessages && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleNewChat}
                    className="h-8 w-8"
                    title={t('chat.newChat')}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleClose}
                  className="h-8 w-8"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-lg p-4 ${
                    message.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-[rgba(26,26,26,0.6)] text-foreground border border-white/10'
                  }`}
                >
                  <div className="flex items-start space-x-2">
                    {message.role === 'bot' && <Bot className="h-4 w-4 mt-0.5 flex-shrink-0" />}
                    {message.role === 'user' && <User className="h-4 w-4 mt-0.5 flex-shrink-0" />}
                    <div className="flex-1">
                      <div className="text-sm max-w-none">
                        <ReactMarkdown
                          remarkPlugins={[remarkGfm]}
                          components={{
                            p: ({ children }) => <p className="m-0 mb-3 last:mb-0 leading-relaxed text-foreground">{children}</p>,
                            strong: ({ children }) => <strong className="font-semibold text-foreground">{children}</strong>,
                            em: ({ children }) => <em className="italic text-foreground">{children}</em>,
                            ul: ({ children }) => <ul className="list-disc list-outside my-3 space-y-2 ml-4 text-foreground">{children}</ul>,
                            ol: ({ children }) => <ol className="list-decimal list-outside my-3 space-y-2 ml-4 text-foreground">{children}</ol>,
                            li: ({ children }) => <li className="leading-relaxed pl-1">{children}</li>,
                            code: ({ children }) => <code className="bg-[rgba(0,0,0,0.3)] px-1.5 py-0.5 rounded text-xs font-mono">{children}</code>,
                            a: ({ href, children }) => <a href={href} className="text-primary underline hover:text-primary/80" target="_blank" rel="noopener noreferrer">{children}</a>,
                          }}
                        >
                          {message.content}
                        </ReactMarkdown>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            
            {(isTyping || showWelcomeAnimation) && (
              <div className="flex justify-start">
                <div className="bg-[rgba(26,26,26,0.6)] border border-white/10 rounded-2xl rounded-bl-sm px-4 py-3 min-w-[60px]">
                  <div className="flex items-center justify-center space-x-1">
                    <div className="h-2 w-2 bg-primary rounded-full" style={{ animation: 'typing-bounce 1.4s ease-in-out infinite', animationDelay: '0ms' }} />
                    <div className="h-2 w-2 bg-primary rounded-full" style={{ animation: 'typing-bounce 1.4s ease-in-out infinite', animationDelay: '200ms' }} />
                    <div className="h-2 w-2 bg-primary rounded-full" style={{ animation: 'typing-bounce 1.4s ease-in-out infinite', animationDelay: '400ms' }} />
                  </div>
                </div>
              </div>
            )}
            
              <div ref={messagesEndRef} />
            </div>

            {/* Quick Actions */}
            {messages.length >= 1 && messages[0]?.id === 'welcome-1' && (
              <div className="px-4 pb-2">
                <div className="flex flex-wrap gap-2">
                  {quickActions.map((action) => (
                    <Button
                      key={action.action}
                      variant="outline"
                      size="sm"
                      onClick={() => handleQuickAction(action.action)}
                      className="text-xs"
                    >
                      {action.label}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* Input */}
            <div className="border-t border-white/20 p-4 glass-card bg-white/5">
              <div className="flex space-x-2 items-end">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                  placeholder={t('chat.inputPlaceholder')}
                  disabled={isTyping || isSubmittingIssue}
                  rows={3}
                  className="flex-1 min-h-[80px] max-h-[200px] resize-none rounded-lg border border-white/10 bg-[rgba(26,26,26,0.6)] backdrop-blur-sm px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-2 focus:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 leading-relaxed"
                  style={{
                    height: 'auto',
                  }}
                  onInput={(e) => {
                    const target = e.target as HTMLTextAreaElement;
                    target.style.height = 'auto';
                    target.style.height = `${Math.min(target.scrollHeight, 200)}px`;
                  }}
                />
                <Button
                  onClick={handleSend}
                  disabled={!input.trim() || isTyping || isSubmittingIssue}
                  size="icon"
                  className="flex-shrink-0"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
          </div>
        </Card>
      )}
    </>
  );
}
