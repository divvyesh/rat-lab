import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface FAQItem {
  question: string;
  answer: string;
  category: string;
}

const SocietiesFAQ: React.FC = () => {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  const faqs: FAQItem[] = [
    // Types of Society
    {
      category: 'Types of Sample Population',
      question: 'What are Personal Sample Populations?',
      answer: 'Personal sample populations are based off your own social media. The networks place you at the centre and those closest to you are people who you share the most engagement with. For LinkedIn accounts, we base your sample population off of who interacts with you and who you interact with in return. For X, we base your sample population off of your followers. This process also creates your author profile and tone of voice.'
    },
    {
      category: 'Types of Sample Population',
      question: 'What are Target Sample Populations?',
      answer: 'When you describe your target sample population, we take that description and run it through our database of over 1,000,000 personas. We retrieve all the matches and rank them by suitability. When we need more personas, we search the web for profiles that fit and add them too.'
    },
    {
      category: 'Types of Sample Population',
      question: 'Why are Personas in Target Sample Populations Anonymous?',
      answer: 'Because our data is based on real people, we do not want to readily disclose the identities of people who are included in a target sample population. This is the same as how survey takers have anonymised data to protect their identity.'
    },
    // Creating Societies
    {
      category: 'Creating Sample Populations',
      question: 'What Makes a Good Description?',
      answer: 'Descriptions can be as brief or as detailed as you like. What\'s most important is that you capture all of the key elements of the people you want in your sample population. Good descriptions often include attributes like an age range, location, and professional industry.'
    },
    {
      category: 'Creating Sample Populations',
      question: 'How to Edit a Sample Population?',
      answer: 'On the Sample Population Homepage, you can click the three dots in the top right corner to bring up a menu. This allows you to edit, refresh and delete sample populations.'
    },
    // Navigating the Network
    {
      category: 'Navigating the Network',
      question: 'How is the Network Arranged?',
      answer: 'The network is an interactive representation of every persona in your sample population. Every dot is an individual, and the lines between them indicate social connections. The network is arranged so that personas are generally situated closer to those they are more closely related with.'
    },
    {
      category: 'Navigating the Network',
      question: 'How Can I Interact with the Personas?',
      answer: 'You can interact with personas by clicking on the dots. This brings up more details about them, gives you an opportunity to chat, and see how they reacted to your content or message.'
    },
    {
      category: 'Navigating the Network',
      question: 'Why are Some Dots Larger?',
      answer: 'Larger dots are people with larger social media followings. They tend to be more socially connected and have a large degree of social influence.'
    },
    {
      category: 'Navigating the Network',
      question: 'What do the Different Colours Mean?',
      answer: 'When you first open a network, the colours indicate the different segments in your sample population. Once your results have been generated, by clicking on the "Attention" and "Action" sections, you can see these behaviors displayed across the whole network.'
    }
  ];

  const categories = Array.from(new Set(faqs.map(faq => faq.category)));

  const toggleExpanded = (index: number) => {
    setExpandedIndex(expandedIndex === index ? null : index);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">Sample Population FAQ</h2>
        <p className="text-zinc-400 text-sm">
          Learn how to create and manage sample populations, and navigate the network visualization.
        </p>
      </div>

      {categories.map(category => {
        const categoryFaqs = faqs.filter(faq => faq.category === category);
        return (
          <div key={category} className="space-y-3">
            <h3 className="text-lg font-bold text-white">{category}</h3>
            {categoryFaqs.map((faq, index) => {
              const globalIndex = faqs.indexOf(faq);
              const isExpanded = expandedIndex === globalIndex;

              return (
                <div
                  key={index}
                  className="bg-zinc-900/50 border border-white/5 rounded-xl overflow-hidden transition-all hover:border-white/10"
                >
                  <button
                    onClick={() => toggleExpanded(globalIndex)}
                    className="w-full p-5 flex items-start justify-between gap-4 text-left hover:bg-zinc-900/30 transition-colors group"
                  >
                    <div className="flex-1">
                      <h4 className="text-base font-bold text-white mb-2">{faq.question}</h4>
                      {isExpanded && (
                        <div className="text-sm text-zinc-400 leading-relaxed mt-3 animate-in fade-in slide-in-from-top-2 duration-200">
                          {faq.answer}
                        </div>
                      )}
                    </div>
                    <div className="flex-shrink-0 pt-1">
                      {isExpanded ? (
                        <ChevronUp className="text-zinc-500" size={20} />
                      ) : (
                        <ChevronDown className="text-zinc-500" size={20} />
                      )}
                    </div>
                  </button>
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
};

export default SocietiesFAQ;



