// app/api/chat/route.ts

// Test to check uploading to github
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { message, conversationId, context, pageUrl, isFirstMessage } = body

    // Check if backend URL is configured
    const backendUrl = process.env.BACKEND_URL
    
    // If backend is configured, try to connect
    if (backendUrl) {
      try {
        const response = await fetch(`${backendUrl}/api/chat`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(process.env.API_KEY && { 'Authorization': `Bearer ${process.env.API_KEY}` })
          },
          body: JSON.stringify({
            message,
            conversationId,
            context,
            pageUrl,
            isFirstMessage
          })
        })

        if (response.ok) {
          const data = await response.json()
          return NextResponse.json(data)
        }
      } catch (fetchError) {
        console.log('Backend not available, using mock responses')
      }
    }

    // Mock responses for testing without backend
    const mockResponses: Record<string, any> = {
      // Greetings
      'hello': {
        response: "Hello! I'm Aldeia Advisor. I'm here to help you navigate the rebuild process after the fire. What questions do you have about rebuilding?",
        confidence: 1.0,
        intent: 'greeting'
      },
      'hi': {
        response: "Hi there! I'm here to assist with your rebuild journey. How can I help you today?",
        confidence: 1.0,
        intent: 'greeting'
      },
      
      // Permits
      'permit': {
        response: "For rebuilding after a fire, you'll typically need several permits:\n\n1. **Building Permit** - Required for construction\n2. **Electrical Permit** - For electrical work\n3. **Plumbing Permit** - For plumbing systems\n4. **Mechanical Permit** - For HVAC systems\n\nThe good news is that many counties have expedited permit processes for fire rebuilds. Would you like specific information for your area?",
        confidence: 0.9,
        intent: 'permits',
        sources: [
          { title: "LA County Rebuild Permits", url: "https://dpw.lacounty.gov/bsd/fire-rebuild" }
        ]
      },
      
      // Timeline
      'timeline': {
        response: "The typical rebuild timeline is:\n\n• **Months 1-2**: Insurance, debris removal, planning\n• **Months 3-4**: Design and permits\n• **Months 5-12**: Construction\n• **Month 13+**: Final inspections and move-in\n\nTimelines can vary based on your specific situation and local requirements.",
        confidence: 0.85,
        intent: 'timeline'
      },
      
      // Insurance
      'insurance': {
        response: "Key insurance steps for rebuilding:\n\n1. Document everything with photos\n2. Get a detailed estimate from contractors\n3. Review your coverage limits\n4. Understand Additional Living Expenses (ALE)\n5. Keep all receipts\n\nWould you like help understanding your specific coverage?",
        confidence: 0.9,
        intent: 'insurance'
      },
      
      // Budget
      'cost': {
        response: "Rebuild costs typically range from $200-400 per square foot in California, depending on:\n\n• Location and site conditions\n• Design complexity\n• Material choices\n• Current construction costs\n\nFor a 2,000 sq ft home, expect $400,000-800,000. Would you like help estimating for your specific needs?",
        confidence: 0.8,
        intent: 'budget'
      },
      
      // Fire-resistant
      'fire resistant': {
        response: "Key fire-resistant building features include:\n\n• **Class A roofing** (metal, tile, or fire-rated composite)\n• **Fire-resistant siding** (fiber cement, stucco)\n• **Tempered glass windows**\n• **Ember-resistant vents**\n• **Defensible space landscaping**\n\nThese features are often required in high fire hazard zones.",
        confidence: 0.95,
        intent: 'safety'
      }
    }

    // Simple keyword matching for mock responses
    const lowerMessage = message.toLowerCase()
    let selectedResponse = null

    for (const [keyword, response] of Object.entries(mockResponses)) {
      if (lowerMessage.includes(keyword)) {
        selectedResponse = response
        break
      }
    }

    // Default response if no keyword match
    if (!selectedResponse) {
      selectedResponse = {
        response: `I understand you're asking about "${message}". While I'm currently in demo mode without full backend connectivity, I can help with questions about:\n\n• Permits and regulations\n• Timeline planning\n• Insurance claims\n• Rebuild costs\n• Fire-resistant designs\n• Contractor selection\n\nWhat specific aspect would you like to know more about?`,
        confidence: 0.7,
        intent: 'general',
        uncertainty: true
      }
    }

    // Add context-specific information
    if (context?.step) {
      selectedResponse.context = context
      
      // Add step-specific suffix
      const stepHelpers: Record<string, string> = {
        location: "\n\nFor your location step, I can also help with zoning requirements and setback rules.",
        style: "\n\nRegarding architectural styles, I can provide information about fire-resistant design options.",
        budget: "\n\nFor budgeting, I can help estimate costs based on your selections.",
        needs: "\n\nFor specific needs like ADUs or solar, I can explain requirements and costs."
      }
      
      if (stepHelpers[context.step]) {
        selectedResponse.response += stepHelpers[context.step]
      }
    }

    return NextResponse.json({
      ...selectedResponse,
      bias: false,
      grounded: true,
      hallucination: false,
      conversationId
    })

  } catch (error) {
    console.error('Chat API error:', error)
    return NextResponse.json({
      response: "I'm having trouble processing your request. Please try again.",
      confidence: 0,
      intent: 'error',
      error: true
    })
  }
}