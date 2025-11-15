/**
 * Multi-step Reasoning AI Service
 *
 * ReAct pattern implementation with chain-of-thought reasoning
 * Agent orchestration with tool use and memory management
 */

export interface ReasoningStep {
  type: 'thought' | 'action' | 'observation'
  content: string
  toolUsed?: string
  toolInput?: any
  toolOutput?: any
  timestamp: number
}

export interface AgentMemory {
  shortTerm: Array<{role: string; content: string}>
  longTerm: Map<string, any>
  workingMemory: Record<string, any>
}

export interface Tool {
  name: string
  description: string
  parameters: Record<string, {type: string; description: string; required?: boolean}>
  execute: (input: any) => Promise<any>
}

export interface ReasoningResult {
  answer: string
  reasoning: ReasoningStep[]
  confidence: number
  toolsUsed: string[]
  totalSteps: number
}

export class MultiStepReasoningService {
  private tools: Map<string, Tool> = new Map()
  private memory: AgentMemory = {
    shortTerm: [],
    longTerm: new Map(),
    workingMemory: {}
  }
  private maxSteps: number = 10
  private llmEndpoint: string
  private llmApiKey: string
  private llmModel: string
  private useLLM: boolean

  constructor() {
    this.llmApiKey = process.env.OPENAI_API_KEY || ''
    this.llmModel = process.env.OPENAI_MODEL || 'gpt-4'
    this.llmEndpoint = 'https://api.openai.com/v1/chat/completions'
    this.useLLM = !!this.llmApiKey
    this.registerDefaultTools()
  }

  /**
   * Run multi-step reasoning using ReAct pattern
   */
  async reason(query: string, context?: Record<string, any>): Promise<ReasoningResult> {
    const steps: ReasoningStep[] = []
    let currentQuery = query

    // Initialize working memory with context
    if (context) {
      this.memory.workingMemory = {...context}
    }

    for (let i = 0; i < this.maxSteps; i++) {
      // Thought: Analyze current situation
      const thought = await this.generateThought(currentQuery, steps)
      steps.push({
        type: 'thought',
        content: thought,
        timestamp: Date.now()
      })

      // Decision: Do we have enough information?
      if (this.canAnswerQuery(thought, steps)) {
        const answer = await this.generateAnswer(query, steps)
        return {
          answer,
          reasoning: steps,
          confidence: this.calculateConfidence(steps),
          toolsUsed: steps.filter(s => s.toolUsed).map(s => s.toolUsed!),
          totalSteps: steps.length
        }
      }

      // Action: Select and execute tool
      const action = await this.selectAction(thought, steps)
      if (action) {
        const tool = this.tools.get(action.toolName)
        if (tool) {
          steps.push({
            type: 'action',
            content: `Using ${action.toolName}`,
            toolUsed: action.toolName,
            toolInput: action.input,
            timestamp: Date.now()
          })

          // Execute tool
          const output = await tool.execute(action.input)

          // Observation: Record result
          steps.push({
            type: 'observation',
            content: `Result: ${JSON.stringify(output).substring(0, 200)}`,
            toolOutput: output,
            timestamp: Date.now()
          })

          // Update working memory
          this.memory.workingMemory[action.toolName] = output
        }
      }
    }

    // Max steps reached, return best effort answer
    const answer = await this.generateAnswer(query, steps)
    return {
      answer,
      reasoning: steps,
      confidence: 0.5,
      toolsUsed: steps.filter(s => s.toolUsed).map(s => s.toolUsed!),
      totalSteps: steps.length
    }
  }

  /**
   * Register a new tool for the agent
   */
  registerTool(tool: Tool): void {
    this.tools.set(tool.name, tool)
  }

  /**
   * Chain-of-thought prompting
   */
  async chainOfThought(problem: string): Promise<{
    steps: string[]
    solution: string
  }> {
    const steps: string[] = []

    // Break down the problem
    steps.push(`Understanding the problem: ${problem}`)
    steps.push('Identifying key components and constraints')
    steps.push('Considering different approaches')
    steps.push('Selecting the most viable solution path')
    steps.push('Executing step-by-step solution')
    steps.push('Verifying the solution')

    const solution = await this.executeProblemSolving(problem, steps)

    return {steps, solution}
  }

  /**
   * Generate thought based on current context
   */
  private async generateThought(query: string, previousSteps: ReasoningStep[]): Promise<string> {
    if (!this.useLLM) {
      // Fallback: Rule-based simulation
      if (previousSteps.length === 0) {
        return `I need to understand: ${query}. Let me break this down.`
      }

      const lastObs = previousSteps.filter(s => s.type === 'observation').pop()
      if (lastObs) {
        return `Based on the previous result, I should analyze ${lastObs.toolOutput}`
      }

      return 'I need more information to answer this question.'
    }

    // Production: Call LLM with ReAct prompt
    const context = this.buildContextPrompt(query, previousSteps)
    const prompt = `You are an AI assistant using the ReAct (Reasoning and Acting) pattern.

${context}

Analyze the current situation and generate your next thought. Be concise and focused.
Available tools: ${Array.from(this.tools.keys()).join(', ')}

Thought:`

    try {
      const response = await fetch(this.llmEndpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.llmApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: this.llmModel,
          messages: [{role: 'user', content: prompt}],
          max_tokens: 150,
          temperature: 0.7
        })
      })

      if (!response.ok) {
        console.error('[MultiStepReasoning] LLM call failed:', response.statusText)
        return 'I need more information to answer this question.'
      }

      const data = await response.json()
      return data.choices[0]?.message?.content?.trim() || 'Unable to generate thought.'
    } catch (error) {
      console.error('[MultiStepReasoning] Error generating thought:', error)
      return 'I need more information to answer this question.'
    }
  }

  /**
   * Select next action based on reasoning
   */
  private async selectAction(thought: string, steps: ReasoningStep[]): Promise<{
    toolName: string
    input: any
  } | null> {
    if (!this.useLLM) {
      // Fallback: Simple heuristics
      if (thought.includes('search')) {
        return {toolName: 'search', input: {query: 'relevant information'}}
      }

      if (thought.includes('calculate')) {
        return {toolName: 'calculator', input: {expression: '1 + 1'}}
      }

      if (thought.includes('model')) {
        return {toolName: 'modelSearch', input: {query: 'furniture'}}
      }

      return null
    }

    // Production: LLM selects tool based on thought
    const toolDescriptions = Array.from(this.tools.values()).map(t =>
      `${t.name}: ${t.description} (params: ${Object.keys(t.parameters).join(', ')})`
    ).join('\n')

    const prompt = `Based on this thought: "${thought}"

Available tools:
${toolDescriptions}

Select the most appropriate tool to use, or respond with "NONE" if no tool is needed.
Respond in JSON format: {"tool": "toolName", "input": {...}} or {"tool": "NONE"}`

    try {
      const response = await fetch(this.llmEndpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.llmApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: this.llmModel,
          messages: [{role: 'user', content: prompt}],
          max_tokens: 100,
          temperature: 0.3
        })
      })

      if (!response.ok) {
        return null
      }

      const data = await response.json()
      const content = data.choices[0]?.message?.content?.trim() || ''

      // Parse JSON response
      const match = content.match(/\{[\s\S]*\}/)
      if (match) {
        const parsed = JSON.parse(match[0])
        if (parsed.tool && parsed.tool !== 'NONE') {
          return {toolName: parsed.tool, input: parsed.input || {}}
        }
      }

      return null
    } catch (error) {
      console.error('[MultiStepReasoning] Error selecting action:', error)
      return null
    }
  }

  /**
   * Check if we can answer the query
   */
  private canAnswerQuery(thought: string, steps: ReasoningStep[]): boolean {
    if (!this.useLLM) {
      // Fallback: Simple heuristics
      return steps.length >= 4 || thought.includes('sufficient') || thought.includes('complete')
    }

    // Production: LLM determines if sufficient information gathered
    return thought.toLowerCase().includes('answer') ||
           thought.toLowerCase().includes('sufficient') ||
           thought.toLowerCase().includes('complete') ||
           thought.toLowerCase().includes('ready to respond') ||
           steps.length >= 8
  }

  /**
   * Generate final answer
   */
  private async generateAnswer(query: string, steps: ReasoningStep[]): Promise<string> {
    if (!this.useLLM) {
      // Fallback: Rule-based answer
      const observations = steps.filter(s => s.type === 'observation')
      if (observations.length > 0) {
        return `Based on my analysis: ${JSON.stringify(observations[observations.length - 1].toolOutput)}`
      }
      return 'Unable to provide a definitive answer with available information.'
    }

    // Production: LLM synthesizes answer from reasoning steps
    const context = this.buildContextPrompt(query, steps)
    const prompt = `Original question: ${query}

${context}

Based on the reasoning steps above, provide a clear, concise answer to the original question:`

    try {
      const response = await fetch(this.llmEndpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.llmApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: this.llmModel,
          messages: [{role: 'user', content: prompt}],
          max_tokens: 300,
          temperature: 0.5
        })
      })

      if (!response.ok) {
        console.error('[MultiStepReasoning] LLM answer generation failed')
        return 'Unable to provide a definitive answer with available information.'
      }

      const data = await response.json()
      return data.choices[0]?.message?.content?.trim() || 'Unable to generate answer.'
    } catch (error) {
      console.error('[MultiStepReasoning] Error generating answer:', error)
      return 'Unable to provide a definitive answer with available information.'
    }
  }

  /**
   * Calculate confidence score
   */
  private calculateConfidence(steps: ReasoningStep[]): number {
    const observations = steps.filter(s => s.type === 'observation').length
    const thoughts = steps.filter(s => s.type === 'thought').length

    if (observations === 0) return 0.3
    if (thoughts / observations > 2) return 0.9
    return 0.7
  }

  /**
   * Execute problem solving
   */
  private async executeProblemSolving(problem: string, steps: string[]): Promise<string> {
    return `Solution for: ${problem} (derived through ${steps.length} reasoning steps)`
  }

  /**
   * Build context prompt from reasoning steps
   */
  private buildContextPrompt(query: string, steps: ReasoningStep[]): string {
    let context = `Query: ${query}\n\nReasoning chain:\n`

    for (let i = 0; i < steps.length; i++) {
      const step = steps[i]
      if (step.type === 'thought') {
        context += `\nThought ${i + 1}: ${step.content}`
      } else if (step.type === 'action') {
        context += `\nAction ${i + 1}: ${step.content}`
        if (step.toolInput) {
          context += ` with input: ${JSON.stringify(step.toolInput)}`
        }
      } else if (step.type === 'observation') {
        context += `\nObservation ${i + 1}: ${step.content}`
      }
    }

    return context
  }

  /**
   * Register default tools
   */
  private registerDefaultTools(): void {
    this.registerTool({
      name: 'search',
      description: 'Search for information',
      parameters: {
        query: {type: 'string', description: 'Search query', required: true}
      },
      execute: async (input) => ({
        results: ['Result 1', 'Result 2'],
        relevance: 0.85
      })
    })

    this.registerTool({
      name: 'calculator',
      description: 'Perform calculations',
      parameters: {
        expression: {type: 'string', description: 'Math expression', required: true}
      },
      execute: async (input) => ({
        result: eval(input.expression.replace(/[^0-9+\-*/().]/g, ''))
      })
    })

    this.registerTool({
      name: 'modelSearch',
      description: 'Search 3D model library',
      parameters: {
        query: {type: 'string', description: 'Model search query', required: true}
      },
      execute: async (input) => ({
        models: [{id: '1', name: `${input.query} model`, category: 'furniture'}],
        count: 1
      })
    })
  }
}

export const multiStepReasoning = new MultiStepReasoningService()
