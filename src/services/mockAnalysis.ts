import type { AnalyzeEmailResponse } from '../types/analysis';

/**
 * Mock analysis service for local development without Firebase/API
 * Switch imports in App.tsx to use this for quick UI testing
 */
export async function analyzeEmail(emailContent: string): Promise<AnalyzeEmailResponse> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Basic validation
  if (!emailContent || emailContent.trim().length < 10) {
    return {
      success: false,
      error: 'Email content is too short'
    };
  }

  const wordCount = emailContent.trim().split(/\s+/).length;

  // Generate realistic scores based on word count
  const lengthScore = wordCount >= 50 && wordCount <= 125 ? 90 :
                      wordCount < 50 ? 60 : 50;

  return {
    success: true,
    data: {
      overallScore: 75,
      scores: {
        clarity: {
          score: 80,
          label: 'Good',
          description: 'Your value proposition is clear but could be more specific.',
          issues: ['Consider adding concrete metrics or outcomes']
        },
        tone: {
          score: 85,
          label: 'Very Good',
          description: 'Professional and approachable tone. Strikes a good balance.',
        },
        length: {
          score: lengthScore,
          label: lengthScore >= 80 ? 'Excellent' : lengthScore >= 60 ? 'Good' : 'Needs Work',
          description: `Email has ${wordCount} words. Optimal range is 50-125 words.`,
          issues: wordCount > 150 ? ['Email is too long - recipients may not read it all'] :
                  wordCount < 50 ? ['Email is too short - may lack necessary context'] : []
        },
        cta: {
          score: 65,
          label: 'Fair',
          description: 'Call-to-action is present but could be more specific and actionable.',
          issues: [
            'Provide concrete time slots instead of asking',
            'Make it easy to say yes with low friction'
          ]
        },
        spam: {
          score: 90,
          label: 'Excellent',
          description: 'No major spam triggers detected. Email should pass most filters.',
        },
        personalization: {
          score: 60,
          label: 'Fair',
          description: 'Some personalization present but could be stronger.',
          issues: [
            'Add specific research about the recipient or company',
            'Reference a recent company achievement or news'
          ]
        },
        structure: {
          score: 75,
          label: 'Good',
          description: 'Good paragraph structure and use of white space.',
          issues: ['Consider breaking longer paragraphs into 2-3 sentences max']
        }
      },
      suggestions: [
        {
          type: 'critical',
          title: 'Make your CTA more specific',
          description: 'Instead of asking if they\'re open to a call, propose 2-3 specific time slots. This reduces friction and back-and-forth.',
          example: 'Are you available for a 15-min call on Tuesday at 2pm or Wednesday at 10am EST?'
        },
        {
          type: 'important',
          title: 'Add concrete proof or social proof',
          description: 'Back up your claims with a case study, testimonial, or specific example. Numbers and named companies build credibility.',
          example: 'We helped TechCorp reduce their sales cycle from 45 to 28 days in Q4 2024.'
        },
        {
          type: 'important',
          title: 'Strengthen personalization',
          description: 'Reference something specific about their company, recent news, or their role. Show you did your research.',
          example: 'I saw your recent announcement about opening offices in Berlin and Paris - that\'s exciting!'
        },
        {
          type: 'minor',
          title: 'Shorten your subject line',
          description: 'Keep subject lines under 50 characters. They often get cut off on mobile devices.',
          example: 'Quick Q about [Company]\'s sales process'
        }
      ],
      rewrites: [
        {
          original: 'Would you be open to a 15-minute call next Tuesday or Wednesday to see if it\'s a fit?',
          improved: 'Are you free for 15 minutes on Tuesday, Oct 15 at 2pm EST or Wednesday, Oct 16 at 10am EST?',
          reason: 'Specific time slots make it easier to say yes. Removes vague language like "to see if it\'s a fit" which adds friction.'
        },
        {
          original: 'I help SaaS companies like yours reduce sales cycle time by 30%',
          improved: 'We helped TechCorp reduce their enterprise sales cycle from 60 to 42 days using our AI qualification tool',
          reason: 'Concrete examples with named companies (when possible) are far more credible than generic percentages. Specificity builds trust.'
        },
        {
          original: 'I noticed your company recently expanded',
          improved: 'I saw your LinkedIn post about opening your Berlin office last month - congrats on the expansion!',
          reason: 'Specific references show genuine research and interest. Mentioning where you found the info adds authenticity.'
        }
      ]
    }
  };
}
