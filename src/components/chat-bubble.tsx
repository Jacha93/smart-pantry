'use client';

import { useState, useEffect, useRef } from 'react';
import { MessageCircle, X, Send, Bot, User, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { useI18n } from '@/hooks/use-i18n';
import { chatAPI } from '@/lib/api';

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
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatWindowRef = useRef<HTMLDivElement>(null);
  const { t, locale } = useI18n();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Nur Begrüßung zeigen wenn Chat leer ist (neuer Chat oder erste Öffnung)
    if (isOpen && messages.length === 0 && !hasUserMessages) {
      // Starte Typing-Animation nach kurzer Verzögerung
      setIsTyping(true);
      setShowWelcomeAnimation(true);
      
      // Simuliere Typing-Zeit
      const typingTimeout = setTimeout(() => {
        setIsTyping(false);
        const welcomeMessage: Message = {
          id: 'welcome',
          role: 'bot',
          content: locale === 'de' 
            ? '👋 Hallo! Ich bin dein Smart Pantry Assistent. Wie kann ich dir helfen?\n\nIch kann dir helfen bei:\n• Fragen zu Lebensmitteln und Rezepten\n• Issue melden\n• Allgemeine Fragen zur App\n\nKlicke einfach auf eine der Optionen oder stelle mir eine Frage!'
            : '👋 Hello! I\'m your Smart Pantry assistant. How can I help you?\n\nI can help you with:\n• Questions about groceries and recipes\n• Report an issue\n• General questions about the app\n\nJust click on one of the options or ask me a question!',
          timestamp: new Date(),
        };
        setMessages([welcomeMessage]);
        setShowWelcomeAnimation(false);
      }, 1500); // Typing-Animation für 1.5 Sekunden

      return () => clearTimeout(typingTimeout);
    }
  }, [isOpen, locale, messages.length, hasUserMessages]);

  // Schließen ohne Reset (Chat-Verlauf bleibt)
  const handleClose = () => {
    setIsOpen(false);
    setIsAnimating(false);
  };

  // Neuen Chat starten (Reset)
  const handleNewChat = () => {
    setMessages([]);
    setInput('');
    setIsTyping(false);
    setShowWelcomeAnimation(false);
    setHasUserMessages(false);
    setIsAnimating(false);
    // Starte Begrüßung erneut
    setIsTyping(true);
    setShowWelcomeAnimation(true);
    setTimeout(() => {
      setIsTyping(false);
      const welcomeMessage: Message = {
        id: 'welcome',
        role: 'bot',
        content: locale === 'de' 
          ? '👋 Hallo! Ich bin dein Smart Pantry Assistent. Wie kann ich dir helfen?\n\nIch kann dir helfen bei:\n• Fragen zu Lebensmitteln und Rezepten\n• Issue melden\n• Allgemeine Fragen zur App\n\nKlicke einfach auf eine der Optionen oder stelle mir eine Frage!'
          : '👋 Hello! I\'m your Smart Pantry assistant. How can I help you?\n\nI can help you with:\n• Questions about groceries and recipes\n• Report an issue\n• General questions about the app\n\nJust click on one of the options or ask me a question!',
        timestamp: new Date(),
      };
      setMessages([welcomeMessage]);
      setShowWelcomeAnimation(false);
    }, 1500);
  };

  // Liquid Glass Animation beim Öffnen
  useEffect(() => {
    if (isOpen && chatWindowRef.current) {
      setIsAnimating(true);
      const timer = setTimeout(() => {
        setIsAnimating(false);
      }, 700); // Animation dauert 0.7s
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const quickActions: QuickAction[] = locale === 'de' 
    ? [
        { label: 'Allgemeine Frage', action: 'general_question' },
        { label: 'Issue melden', action: 'report_issue' },
        { label: 'Lebensmittel fragen', action: 'groceries_question' },
        { label: 'Rezept-Fragen', action: 'recipes_question' },
      ]
    : [
        { label: 'General Question', action: 'general_question' },
        { label: 'Report Issue', action: 'report_issue' },
        { label: 'Groceries Question', action: 'groceries_question' },
        { label: 'Recipe Questions', action: 'recipes_question' },
      ];

  const handleQuickAction = (action: string) => {
    let message = '';
    
    if (action === 'report_issue') {
      message = locale === 'de' 
        ? 'Ich möchte ein Issue melden'
        : 'I want to report an issue';
    } else if (action === 'general_question') {
      message = locale === 'de'
        ? 'Ich habe eine allgemeine Frage'
        : 'I have a general question';
    } else if (action === 'groceries_question') {
      message = locale === 'de'
        ? 'Ich habe eine Frage zu Lebensmitteln'
        : 'I have a question about groceries';
    } else if (action === 'recipes_question') {
      message = locale === 'de'
        ? 'Ich habe eine Frage zu Rezepten'
        : 'I have a question about recipes';
    }

    if (message) {
      setInput(message);
      handleSend();
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
      // Prüfe ob es eine Issue-Meldung ist
      const isIssueReport = userMessage.content.toLowerCase().includes('issue') || 
                            userMessage.content.toLowerCase().includes('fehler') ||
                            userMessage.content.toLowerCase().includes('bug') ||
                            userMessage.content.toLowerCase().includes('problem');

      if (isIssueReport) {
        await handleIssueReport(userMessage.content);
      } else {
        await handleBotResponse(userMessage.content);
      }
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        role: 'bot',
        content: locale === 'de'
          ? '❌ Entschuldigung, es ist ein Fehler aufgetreten. Bitte versuche es später erneut.'
          : '❌ Sorry, an error occurred. Please try again later.',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleIssueReport = async (description: string) => {
    setIsSubmittingIssue(true);
    
    const instructionMessage: Message = {
      id: `instruction-${Date.now()}`,
      role: 'bot',
      content: locale === 'de'
        ? '📝 Um ein Issue zu melden, beschreibe bitte kurz:\n\n1. Was ist das Problem?\n2. Wann tritt es auf?\n3. Welche Schritte führen zum Problem?\n\nIch erstelle dann automatisch ein Issue auf GitHub.'
        : '📝 To report an issue, please describe:\n\n1. What is the problem?\n2. When does it occur?\n3. What steps lead to the problem?\n\nI will then automatically create an issue on GitHub.',
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, instructionMessage]);

      // Wenn die Beschreibung bereits ausreichend ist, erstelle direkt das Issue
      if (description.length > 20) {
        try {
          const response = await chatAPI.createIssue(
            locale === 'de' 
              ? `Issue: ${description.substring(0, 50)}...`
              : `Issue: ${description.substring(0, 50)}...`,
            description,
            ['bug', 'user-reported']
          );

        const successMessage: Message = {
          id: `success-${Date.now()}`,
          role: 'bot',
          content: locale === 'de'
            ? `✅ Issue erfolgreich erstellt! Du findest es hier: ${response.data.html_url}\n\nVielen Dank für dein Feedback!`
            : `✅ Issue created successfully! You can find it here: ${response.data.html_url}\n\nThank you for your feedback!`,
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, successMessage]);
      } catch (error) {
        const errorMsg: Message = {
          id: `issue-error-${Date.now()}`,
          role: 'bot',
          content: locale === 'de'
            ? '❌ Fehler beim Erstellen des Issues. Bitte melde es manuell auf GitHub: https://github.com/Jacha93/smart-pantry/issues/new'
            : '❌ Error creating issue. Please report it manually on GitHub: https://github.com/Jacha93/smart-pantry/issues/new',
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, errorMsg]);
      }
    }
    
    setIsSubmittingIssue(false);
  };

  const handleBotResponse = async (userMessage: string) => {
    try {
      const response = await chatAPI.sendMessage(userMessage, 'smart-pantry');

      const botMessage: Message = {
        id: `bot-${Date.now()}`,
        role: 'bot',
        content: response.data.response,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      // Fallback zu lokalen Antworten
      const fallbackResponse = getFallbackResponse(userMessage);
      const botMessage: Message = {
        id: `bot-${Date.now()}`,
        role: 'bot',
        content: fallbackResponse,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, botMessage]);
    }
  };

  const getFallbackResponse = (userMessage: string): string => {
    const lowerMessage = userMessage.toLowerCase();
    const isGerman = locale === 'de';

    // Projektbezogene Antworten
    if (lowerMessage.includes('issue') || lowerMessage.includes('fehler') || lowerMessage.includes('bug')) {
      return isGerman
        ? 'Um ein Issue zu melden:\n\n1. Beschreibe kurz das Problem\n2. Nenne wenn möglich die Schritte zum Reproduzieren\n3. Ich erstelle dann automatisch ein GitHub Issue\n\nOder nutze: "Issue melden" als Quick-Action.'
        : 'To report an issue:\n\n1. Briefly describe the problem\n2. Mention steps to reproduce if possible\n3. I will then automatically create a GitHub Issue\n\nOr use: "Report Issue" as a quick action.';
    }

    if (lowerMessage.includes('rezept') || lowerMessage.includes('recipe')) {
      return isGerman
        ? 'Rezepte kannst du finden, indem du:\n\n1. Ein Foto deines Kühlschranks machst\n2. Die App analysiert die Lebensmittel\n3. Du bekommst passende Rezeptvorschläge\n\nGespeicherte Rezepte findest du auf der "Rezepte"-Seite.'
        : 'You can find recipes by:\n\n1. Taking a photo of your fridge\n2. The app analyzes the groceries\n3. You get matching recipe suggestions\n\nSaved recipes can be found on the "Recipes" page.';
    }

    if (lowerMessage.includes('lebensmittel') || lowerMessage.includes('grocery') || lowerMessage.includes('inventar')) {
      return isGerman
        ? 'Dein Lebensmittel-Inventar kannst du auf der "Lebensmittel"-Seite verwalten:\n\n• Lebensmittel hinzufügen\n• Verfallsdaten tracken\n• Menge und Einheiten verwalten\n\nNutze die Foto-Analyse für schnelles Hinzufügen!'
        : 'You can manage your grocery inventory on the "Groceries" page:\n\n• Add groceries\n• Track expiration dates\n• Manage quantities and units\n\nUse photo analysis for quick adding!';
    }

    if (lowerMessage.includes('hilfe') || lowerMessage.includes('help')) {
      return isGerman
        ? 'Ich helfe dir gerne bei:\n\n• Fragen zu Lebensmitteln und Rezepten\n• Issue-Meldungen\n• Allgemeinen Fragen zur App\n\nStelle einfach eine Frage oder nutze die Quick-Actions!'
        : 'I can help you with:\n\n• Questions about groceries and recipes\n• Issue reports\n• General questions about the app\n\nJust ask a question or use the quick actions!';
    }

    // Standard-Antwort
    return isGerman
      ? 'Ich kann dir bei Fragen zu Smart Pantry helfen:\n\n• Lebensmittel-Verwaltung\n• Rezept-Vorschläge\n• Issue-Meldungen\n• Allgemeine Fragen\n\nStelle mir eine spezifische Frage oder nutze die Quick-Actions oben!'
      : 'I can help you with Smart Pantry questions:\n\n• Grocery management\n• Recipe suggestions\n• Issue reports\n• General questions\n\nAsk me a specific question or use the quick actions above!';
  };

  return (
    <>
      {/* Chat Bubble Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-2xl hover:bg-primary/90 hover:scale-110 transition-all duration-200"
          aria-label="Open chat"
        >
          <MessageCircle className="h-6 w-6" />
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <Card 
          ref={chatWindowRef}
          className={`fixed bottom-6 right-6 z-50 flex h-[600px] w-[400px] flex-col border border-white/10 shadow-2xl chat-bubble-container ${isAnimating ? 'chat-bubble-slide-up' : ''}`}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/10 p-4">
            <div className="flex items-center space-x-2">
              <Bot className="h-5 w-5 text-primary" />
              <h3 className="font-semibold text-foreground">
                {locale === 'de' ? 'Smart Pantry Assistent' : 'Smart Pantry Assistant'}
              </h3>
            </div>
            <div className="flex items-center space-x-2">
              {hasUserMessages && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleNewChat}
                  className="h-8 w-8"
                  title={locale === 'de' ? 'Neuer Chat' : 'New Chat'}
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
                  className={`max-w-[80%] rounded-lg p-3 ${
                    message.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-[rgba(26,26,26,0.6)] text-foreground border border-white/10'
                  }`}
                >
                  <div className="flex items-start space-x-2">
                    {message.role === 'bot' && <Bot className="h-4 w-4 mt-0.5 flex-shrink-0" />}
                    {message.role === 'user' && <User className="h-4 w-4 mt-0.5 flex-shrink-0" />}
                    <div className="flex-1">
                      <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            
            {(isTyping || showWelcomeAnimation) && (
              <div className="flex justify-start">
                <div className="bg-[rgba(26,26,26,0.6)] border border-white/10 rounded-lg p-3">
                  <div className="flex space-x-1.5 items-center">
                    <div className="h-2.5 w-2.5 bg-primary rounded-full" style={{ animation: 'typing-dots 1.4s ease-in-out infinite', animationDelay: '0ms' }} />
                    <div className="h-2.5 w-2.5 bg-primary rounded-full" style={{ animation: 'typing-dots 1.4s ease-in-out infinite', animationDelay: '233ms' }} />
                    <div className="h-2.5 w-2.5 bg-primary rounded-full" style={{ animation: 'typing-dots 1.4s ease-in-out infinite', animationDelay: '466ms' }} />
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Actions */}
          {messages.length === 1 && messages[0]?.id === 'welcome' && (
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
          <div className="border-t border-white/10 p-4">
            <div className="flex space-x-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                placeholder={locale === 'de' ? 'Schreibe eine Nachricht...' : 'Type a message...'}
                disabled={isTyping || isSubmittingIssue}
                className="flex-1"
              />
              <Button
                onClick={handleSend}
                disabled={!input.trim() || isTyping || isSubmittingIssue}
                size="icon"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </Card>
      )}
    </>
  );
}
