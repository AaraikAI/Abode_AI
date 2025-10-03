// app/api/chat/search/route.ts
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { query, limit = 5 } = body

    // Mock search results for testing
    const mockResults = [
      {
        title: "LA County Fire Rebuild FAQ",
        url: "https://dpw.lacounty.gov/bsd/fire-rebuild",
        snippet: "Comprehensive guide for rebuilding after wildfire damage in Los Angeles County..."
      },
      {
        title: "Pasadena Rebuild Permits",
        url: "https://www.cityofpasadena.net/planning/",
        snippet: "Information about expedited permits for fire rebuild in Pasadena..."
      },
      {
        title: "California Building Code - Fire Zones",
        url: "https://osfm.fire.ca.gov/",
        snippet: "Requirements for building in high fire hazard severity zones..."
      },
      {
        title: "Insurance Claims Guide",
        url: "https://insurance.ca.gov/",
        snippet: "Steps for filing insurance claims after wildfire damage..."
      },
      {
        title: "FEMA Disaster Assistance",
        url: "https://www.fema.gov/disaster",
        snippet: "Federal assistance programs for wildfire victims..."
      }
    ]

    // Filter results based on query
    const filteredResults = mockResults
      .filter(result => 
        result.title.toLowerCase().includes(query.toLowerCase()) ||
        result.snippet.toLowerCase().includes(query.toLowerCase())
      )
      .slice(0, limit)

    // If no filtered results, return top results
    const results = filteredResults.length > 0 ? filteredResults : mockResults.slice(0, limit)

    return NextResponse.json({ results })

  } catch (error) {
    console.error('Search API error:', error)
    return NextResponse.json(
      { results: [], error: 'Search temporarily unavailable' },
      { status: 200 } // Return 200 to prevent UI errors
    )
  }
}