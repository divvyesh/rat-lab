import React, { useState } from 'react';
import { ChevronDown, ChevronUp, HelpCircle } from 'lucide-react';

interface FAQItem {
  question: string;
  answer: string;
  boldText?: string; // Text to bold within the answer
}

const PersonasFAQ: React.FC = () => {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  const faqs: FAQItem[] = [
    {
      question: 'Where does the data come from?',
      answer: 'Each persona is modeled using **AI-generated behavioral profiles** based on established behavioral science principles. We use advanced language models trained on diverse datasets to create personas with authentic behaviors, interests, and backgrounds that reflect real-world patterns without relying on individual personal data.',
      boldText: 'AI-generated behavioral profiles'
    },
    {
      question: 'How are personas created?',
      answer: 'We analyze behavioral traits (risk aversion, loss aversion, price sensitivity, cognitive reflection, social conformity, novelty seeking) and demographic information to build personas with beliefs, preferences, and behaviors that accurately reflect their profile. These personas adapt their behavior to different contexts, just like how real people communicate differently in professional versus casual settings.'
    },
    {
      question: 'What about characteristics that aren\'t easily modeled?',
      answer: 'Our behavioral trait system allows us to model many audience characteristics through the six core dimensions. However, when you create a target cohort requiring specific attributes that aren\'t directly captured by traits - like seeking life insurance or owning a Tesla - you can add these characteristics through custom prompts and grounding sources when creating your segments.'
    },
    {
      question: 'Why chat to a persona?',
      answer: 'Think of chatting to a persona like conducting a user interview. You can ask them about their thoughts, feelings and preferences, as well as finding out why they reacted the way they did to the message you tested. This helps you understand not just what they think, but why they think it.'
    },
    {
      question: 'How accurate are AI personas compared to real people?',
      answer: 'Our personas are designed to represent behavioral patterns and decision-making processes, not to replicate specific individuals. They\'re based on established behavioral science research (Kahneman, Tversky, etc.) and are validated through statistical analysis. While they can\'t replace real user research, they provide valuable insights for early-stage testing and hypothesis validation.'
    },
    {
      question: 'Can I customize persona behavior?',
      answer: 'Yes! You can adjust all six behavioral traits (0-100 scale), add custom grounding sources, specify demographic details, and even toggle between System 1 (fast/intuitive) and System 2 (slow/deliberate) thinking modes. This gives you complete control over persona characteristics.'
    }
  ];

  const toggleExpanded = (index: number) => {
    setExpandedIndex(expandedIndex === index ? null : index);
  };

  const formatAnswer = (answer: string, boldText?: string) => {
    if (boldText) {
      const parts = answer.split(boldText);
      return (
        <>
          {parts[0]}
          <strong className="text-white font-bold">{boldText}</strong>
          {parts[1]}
        </>
      );
    }
    return answer;
  };

  return (
    <div className="space-y-3">
      {faqs.map((faq, index) => {
        const isExpanded = expandedIndex === index;

        return (
          <div
            key={index}
            className="bg-zinc-900/50 border border-white/5 rounded-xl overflow-hidden transition-all hover:border-white/10"
          >
            <button
              onClick={() => toggleExpanded(index)}
              className="w-full p-5 flex items-start justify-between gap-4 text-left hover:bg-zinc-900/30 transition-colors group"
            >
              <div className="flex items-start gap-3 flex-1">
                <div className="flex-shrink-0 pt-1">
                  {isExpanded ? (
                    <ChevronDown className="text-zinc-500 group-hover:text-zinc-400 transition-colors" size={16} />
                  ) : (
                    <ChevronDown className="text-zinc-500 group-hover:text-zinc-400 transition-colors rotate-[-90deg]" size={16} />
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="text-base font-bold text-white mb-2">{faq.question}</h3>
                  {isExpanded && (
                    <div className="text-sm text-zinc-400 leading-relaxed mt-3 animate-in fade-in slide-in-from-top-2 duration-200">
                      {formatAnswer(faq.answer, faq.boldText)}
                    </div>
                  )}
                </div>
              </div>
            </button>
          </div>
        );
      })}

      <div className="mt-6 p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-xl">
        <p className="text-sm text-indigo-300">
          <strong>Learn more:</strong> Check out our{' '}
          <a href="/docs/methodology" className="underline hover:text-indigo-200">
            methodology documentation
          </a>{' '}
          for detailed information about how Rat Lab creates and uses personas.
        </p>
      </div>
    </div>
  );
};

export default PersonasFAQ;

