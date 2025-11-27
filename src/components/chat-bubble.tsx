'use client';

import { useState, useEffect, useRef } from 'react';
import { MessageCircle, X, Send, Bot, User, Plus, LogIn } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
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
            ? (locale === 'de' 
                ? '👋 Hallo! Ich bin dein Smart Pantry Assistent. Wie kann ich dir helfen?'
                : '👋 Hello! I\'m your Smart Pantry assistant. How can I help you?')
            : (locale === 'de'
                ? '👋 Hallo! Ich bin der Smart Pantry Assistent. Ich beantworte gerne allgemeine Fragen zur App!'
                : '👋 Hello! I\'m the Smart Pantry assistant. I\'m happy to answer general questions about the app!'),
          timestamp: new Date(),
        };
        setMessages([welcomeMessage1]);
        
        // Zweite Nachricht: Hilfe-Bereiche (unterschiedlich je nach Auth-Status)
        const timeout2 = setTimeout(() => {
          const welcomeMessage2: Message = {
            id: 'welcome-2',
            role: 'bot',
            content: isAuthenticated
              ? (locale === 'de'
                  ? 'Ich kann dir helfen bei:\n\n• Fragen zu Lebensmitteln und Rezepten\n\n• Issue melden\n\n• Allgemeine Fragen zur App'
                  : 'I can help you with:\n\n• Questions about groceries and recipes\n\n• Report an issue\n\n• General questions about the app')
              : (locale === 'de'
                  ? 'Als Gast kannst du:\n\n• Allgemeine Fragen zur App stellen\n\n• Issue melden\n\n• Mehr über Smart Pantry erfahren\n\n💡 **Tipp:** Melde dich an, um alle Funktionen zu nutzen!'
                  : 'As a guest you can:\n\n• Ask general questions about the app\n\n• Report an issue\n\n• Learn more about Smart Pantry\n\n💡 **Tip:** Sign in to use all features!'),
            timestamp: new Date(),
          };
          setMessages(prev => [...prev, welcomeMessage2]);
          
          // Dritte Nachricht: Call-to-Action
          const timeout3 = setTimeout(() => {
            const welcomeMessage3: Message = {
              id: 'welcome-3',
              role: 'bot',
              content: locale === 'de'
                ? 'Klicke einfach auf eine der Optionen oder stelle mir eine Frage!'
                : 'Just click on one of the options or ask me a question!',
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
  }, [isOpen, locale, hasUserMessages, isAuthenticated]); // Auth-Status als Dependency

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
            ? (locale === 'de' 
                ? '👋 Hallo! Ich bin dein Smart Pantry Assistent. Wie kann ich dir helfen?'
                : '👋 Hello! I\'m your Smart Pantry assistant. How can I help you?')
            : (locale === 'de'
                ? '👋 Hallo! Ich bin der Smart Pantry Assistent. Ich beantworte gerne allgemeine Fragen zur App!'
                : '👋 Hello! I\'m the Smart Pantry assistant. I\'m happy to answer general questions about the app!'),
          timestamp: new Date(),
        };
        setMessages([welcomeMessage1]);
        
        // Zweite Nachricht: Hilfe-Bereiche (unterschiedlich je nach Auth-Status)
        const timeout2 = setTimeout(() => {
          const welcomeMessage2: Message = {
            id: 'welcome-2',
            role: 'bot',
            content: isAuthenticated
              ? (locale === 'de'
                  ? 'Ich kann dir helfen bei:\n\n• Fragen zu Lebensmitteln und Rezepten\n\n• Issue melden\n\n• Allgemeine Fragen zur App'
                  : 'I can help you with:\n\n• Questions about groceries and recipes\n\n• Report an issue\n\n• General questions about the app')
              : (locale === 'de'
                  ? 'Als Gast kannst du:\n\n• Allgemeine Fragen zur App stellen\n\n• Issue melden\n\n• Mehr über Smart Pantry erfahren\n\n💡 **Tipp:** Melde dich an, um alle Funktionen zu nutzen!'
                  : 'As a guest you can:\n\n• Ask general questions about the app\n\n• Report an issue\n\n• Learn more about Smart Pantry\n\n💡 **Tip:** Sign in to use all features!'),
            timestamp: new Date(),
          };
          setMessages(prev => [...prev, welcomeMessage2]);
        
        // Dritte Nachricht: Call-to-Action
        const timeout3 = setTimeout(() => {
          const welcomeMessage3: Message = {
            id: 'welcome-3',
            role: 'bot',
            content: locale === 'de'
              ? 'Klicke einfach auf eine der Optionen oder stelle mir eine Frage!'
              : 'Just click on one of the options or ask me a question!',
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
    ? (locale === 'de' 
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
          ])
    : (locale === 'de'
        ? [
            { label: 'Allgemeine Frage', action: 'general_question' },
            { label: 'Issue melden', action: 'report_issue' },
            { label: 'Über Smart Pantry', action: 'about_app' },
            { label: 'Jetzt anmelden', action: 'sign_in' },
          ]
        : [
            { label: 'General Question', action: 'general_question' },
            { label: 'Report Issue', action: 'report_issue' },
            { label: 'About Smart Pantry', action: 'about_app' },
            { label: 'Sign In', action: 'sign_in' },
          ]);

  const handleQuickAction = (action: string) => {
    if (action === 'report_issue') {
      // Bei Issue-Meldung: Zeige nur die Anweisung, warte auf User-Beschreibung
      setIsWaitingForIssueDescription(true);
      const instructionMessage: Message = {
        id: `instruction-${Date.now()}`,
        role: 'bot',
        content: locale === 'de'
          ? '📝 Um ein Issue zu melden, beschreibe bitte kurz:\n\n1. Was ist das Problem?\n2. Wann tritt es auf?\n3. Welche Schritte führen zum Problem?\n\nIch erstelle dann automatisch ein Issue auf GitHub.'
          : '📝 To report an issue, please describe:\n\n1. What is the problem?\n2. When does it occur?\n3. What steps lead to the problem?\n\nI will then automatically create an issue on GitHub.',
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
        content: locale === 'de'
          ? '🔐 Um alle Funktionen von Smart Pantry zu nutzen, melde dich bitte an:\n\n• **Registrieren:** Erstelle ein kostenloses Konto\n• **Anmelden:** Falls du bereits ein Konto hast\n\nNach der Anmeldung kannst du:\n• Lebensmittel verwalten\n• Rezepte entdecken\n• Fotos analysieren\n• Einkaufslisten erstellen\n\nKlicke auf "Login" in der Navigation oder nutze den Login-Dialog!'
          : '🔐 To use all Smart Pantry features, please sign in:\n\n• **Sign Up:** Create a free account\n• **Sign In:** If you already have an account\n\nAfter signing in you can:\n• Manage groceries\n• Discover recipes\n• Analyze photos\n• Create shopping lists\n\nClick "Login" in the navigation or use the login dialog!',
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
        content: locale === 'de'
          ? '📱 **Smart Pantry** ist dein intelligenter Küchenassistent:\n\n✨ **Features:**\n• Lebensmittel-Inventar verwalten\n• KI-gestützte Foto-Analyse\n• Personalisierte Rezeptvorschläge\n• Einkaufslisten erstellen\n• Ablaufdaten tracken\n\n🎯 **Vorteile:**\n• Weniger Lebensmittelverschwendung\n• Zeit sparen beim Einkaufen\n• Immer passende Rezepte parat\n\n💡 Melde dich an, um alle Funktionen zu nutzen!'
          : '📱 **Smart Pantry** is your intelligent kitchen assistant:\n\n✨ **Features:**\n• Manage grocery inventory\n• AI-powered photo analysis\n• Personalized recipe suggestions\n• Create shopping lists\n• Track expiration dates\n\n🎯 **Benefits:**\n• Less food waste\n• Save time shopping\n• Always have matching recipes\n\n💡 Sign in to use all features!',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, aboutMessage]);
      setHasUserMessages(true);
      return;
    }
    
    let message = '';
    
    if (action === 'general_question') {
      message = locale === 'de'
        ? 'Ich habe eine allgemeine Frage'
        : 'I have a general question';
    } else if (action === 'groceries_question' && isAuthenticated) {
      message = locale === 'de'
        ? 'Ich habe eine Frage zu Lebensmitteln'
        : 'I have a question about groceries';
    } else if (action === 'recipes_question' && isAuthenticated) {
      message = locale === 'de'
        ? 'Ich habe eine Frage zu Rezepten'
        : 'I have a question about recipes';
    }

    if (message) {
      setInput(message);
      handleSend();
    } else if (action === 'groceries_question' || action === 'recipes_question') {
      // Wenn nicht eingeloggt und versucht auf Lebensmittel/Rezepte zuzugreifen
      const restrictedMessage: Message = {
        id: `restricted-${Date.now()}`,
        role: 'bot',
        content: locale === 'de'
          ? '🔐 Diese Funktion ist nur für eingeloggte Nutzer verfügbar.\n\nMelde dich an, um:\n• Dein Lebensmittel-Inventar zu verwalten\n• Rezepte basierend auf deinen Zutaten zu erhalten\n• Fotos zu analysieren\n\nKlicke auf "Login" in der Navigation!'
          : '🔐 This feature is only available for signed-in users.\n\nSign in to:\n• Manage your grocery inventory\n• Get recipes based on your ingredients\n• Analyze photos\n\nClick "Login" in the navigation!',
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
          content: locale === 'de'
            ? '📝 Um ein Issue zu melden, beschreibe bitte kurz:\n\n1. Was ist das Problem?\n2. Wann tritt es auf?\n3. Welche Schritte führen zum Problem?\n\nIch erstelle dann automatisch ein Issue auf GitHub.'
            : '📝 To report an issue, please describe:\n\n1. What is the problem?\n2. When does it occur?\n3. What steps lead to the problem?\n\nI will then automatically create an issue on GitHub.',
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
    
    // Prüfe ob die Beschreibung ausreichend ist
    if (!description || description.trim().length < 10) {
      const errorMsg: Message = {
        id: `issue-error-${Date.now()}`,
        role: 'bot',
        content: locale === 'de'
          ? '❌ Die Beschreibung ist zu kurz. Bitte beschreibe das Problem ausführlicher (mindestens 10 Zeichen).'
          : '❌ The description is too short. Please describe the problem in more detail (at least 10 characters).',
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
      
      const issueTitle = locale === 'de' 
        ? `[${isAuthenticated ? 'User' : 'Gast'}] ${description.substring(0, 50)}${description.length > 50 ? '...' : ''}`
        : `[${isAuthenticated ? 'User' : 'Guest'}] ${description.substring(0, 50)}${description.length > 50 ? '...' : ''}`;
      
      const issueBody = isAuthenticated
        ? description
        : `${description}\n\n---\n*Issue gemeldet von Gast-User (nicht eingeloggt)*`;
      
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
        content: locale === 'de'
          ? `✅ Issue erfolgreich erstellt! Du findest es hier: ${issueUrl}\n\nVielen Dank für dein Feedback!`
          : `✅ Issue created successfully! You can find it here: ${issueUrl}\n\nThank you for your feedback!`,
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
        content: locale === 'de'
          ? `❌ Fehler beim Erstellen des Issues. Bitte melde es manuell auf GitHub:\n\n${fallbackUrl}\n\n**Hinweis:** Der GitHub Token ist möglicherweise nicht konfiguriert oder der Service ist nicht verfügbar.`
          : `❌ Error creating issue. Please report it manually on GitHub:\n\n${fallbackUrl}\n\n**Note:** The GitHub token may not be configured or the service is unavailable.`,
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
      return isGerman
        ? 'Um ein Issue zu melden:\n\n1. Beschreibe kurz das Problem\n2. Nenne wenn möglich die Schritte zum Reproduzieren\n3. Ich erstelle dann automatisch ein GitHub Issue\n\nOder nutze: "Issue melden" als Quick-Action.'
        : 'To report an issue:\n\n1. Briefly describe the problem\n2. Mention steps to reproduce if possible\n3. I will then automatically create a GitHub Issue\n\nOr use: "Report Issue" as a quick action.';
    }

    if (authenticated) {
      // Eingeloggte User: Alle Funktionen
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
    } else {
      // Nicht eingeloggte User: Nur allgemeine Infos + Login-Motivation
      if (lowerMessage.includes('rezept') || lowerMessage.includes('recipe') || 
          lowerMessage.includes('lebensmittel') || lowerMessage.includes('grocery') || 
          lowerMessage.includes('inventar')) {
        return isGerman
          ? '🔐 Diese Funktionen sind nur für eingeloggte Nutzer verfügbar.\n\n**Smart Pantry bietet:**\n• Lebensmittel-Inventar verwalten\n• KI-gestützte Foto-Analyse\n• Personalisierte Rezeptvorschläge\n• Einkaufslisten erstellen\n\n💡 **Melde dich an**, um alle Funktionen zu nutzen! Klicke auf "Login" in der Navigation.'
          : '🔐 These features are only available for signed-in users.\n\n**Smart Pantry offers:**\n• Manage grocery inventory\n• AI-powered photo analysis\n• Personalized recipe suggestions\n• Create shopping lists\n\n💡 **Sign in** to use all features! Click "Login" in the navigation.';
      }
    }

    if (lowerMessage.includes('hilfe') || lowerMessage.includes('help')) {
      return authenticated
        ? (isGerman
            ? 'Ich helfe dir gerne bei:\n\n• Fragen zu Lebensmitteln und Rezepten\n• Issue-Meldungen\n• Allgemeinen Fragen zur App\n\nStelle einfach eine Frage oder nutze die Quick-Actions!'
            : 'I can help you with:\n\n• Questions about groceries and recipes\n• Issue reports\n• General questions about the app\n\nJust ask a question or use the quick actions!')
        : (isGerman
            ? 'Als Gast kann ich dir helfen bei:\n\n• Allgemeinen Fragen zur App\n• Issue-Meldungen\n• Informationen über Smart Pantry\n\n💡 **Tipp:** Melde dich an, um alle Funktionen zu nutzen!'
            : 'As a guest I can help you with:\n\n• General questions about the app\n• Issue reports\n• Information about Smart Pantry\n\n💡 **Tip:** Sign in to use all features!');
    }

    // Standard-Antwort
    return authenticated
      ? (isGerman
          ? 'Ich kann dir bei Fragen zu Smart Pantry helfen:\n\n• Lebensmittel-Verwaltung\n• Rezept-Vorschläge\n• Issue-Meldungen\n• Allgemeine Fragen\n\nStelle mir eine spezifische Frage oder nutze die Quick-Actions oben!'
          : 'I can help you with Smart Pantry questions:\n\n• Grocery management\n• Recipe suggestions\n• Issue reports\n• General questions\n\nAsk me a specific question or use the quick actions above!')
      : (isGerman
          ? 'Ich beantworte gerne allgemeine Fragen zu Smart Pantry!\n\n💡 **Tipp:** Melde dich an, um alle Funktionen zu nutzen:\n• Lebensmittel verwalten\n• Rezepte entdecken\n• Fotos analysieren\n\nKlicke auf "Login" in der Navigation!'
          : 'I\'m happy to answer general questions about Smart Pantry!\n\n💡 **Tip:** Sign in to use all features:\n• Manage groceries\n• Discover recipes\n• Analyze photos\n\nClick "Login" in the navigation!');
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
          className={`fixed bottom-6 right-6 z-50 h-[600px] w-[400px] border border-white/10 shadow-2xl chat-bubble-container overflow-hidden ${isAnimating ? 'chat-bubble-slide-up' : ''}`}
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
                  placeholder={locale === 'de' ? 'Schreibe eine Nachricht... (Shift+Enter für neue Zeile)' : 'Type a message... (Shift+Enter for new line)'}
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
