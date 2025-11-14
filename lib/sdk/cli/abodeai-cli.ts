#!/usr/bin/env node
/**
 * Abode AI CLI Tool
 *
 * Command-line interface for Abode AI API
 */

import { AbodeAI, AbodeAIError } from '../typescript/index'
import * as fs from 'fs'
import * as path from 'path'

interface CLIConfig {
  apiKey?: string
  baseUrl?: string
  defaultProjectId?: string
}

class AbodeAICLI {
  private client: AbodeAI | null = null
  private config: CLIConfig = {}
  private configPath = path.join(process.env.HOME || '', '.abodeai', 'config.json')

  async run(args: string[]): Promise<void> {
    const [command, ...commandArgs] = args

    // Load config
    this.loadConfig()

    // Check for help
    if (!command || command === 'help' || command === '--help' || command === '-h') {
      this.showHelp()
      return
    }

    // Check for version
    if (command === 'version' || command === '--version' || command === '-v') {
      console.log('Abode AI CLI v1.0.0')
      return
    }

    // Handle config commands
    if (command === 'config') {
      await this.handleConfig(commandArgs)
      return
    }

    // Initialize client for other commands
    if (!this.config.apiKey) {
      console.error('❌ Error: API key not configured')
      console.error('Run: abodeai config set-key YOUR_API_KEY')
      process.exit(1)
    }

    this.client = new AbodeAI({
      apiKey: this.config.apiKey,
      baseUrl: this.config.baseUrl
    })

    // Route command
    try {
      switch (command) {
        case 'projects':
          await this.handleProjects(commandArgs)
          break
        case 'models':
          await this.handleModels(commandArgs)
          break
        case 'render':
          await this.handleRender(commandArgs)
          break
        case 'energy':
          await this.handleEnergy(commandArgs)
          break
        case 'bionic':
          await this.handleBionic(commandArgs)
          break
        case 'blockchain':
          await this.handleBlockchain(commandArgs)
          break
        case 'arvr':
          await this.handleARVR(commandArgs)
          break
        case 'twin':
          await this.handleDigitalTwin(commandArgs)
          break
        case 'marketplace':
          await this.handleMarketplace(commandArgs)
          break
        case 'referrals':
          await this.handleReferrals(commandArgs)
          break
        default:
          console.error(`❌ Unknown command: ${command}`)
          console.error('Run "abodeai help" for usage information')
          process.exit(1)
      }
    } catch (error: any) {
      if (error instanceof AbodeAIError) {
        console.error(`❌ Error: ${error.message}`)
        if (error.code) {
          console.error(`   Code: ${error.code}`)
        }
      } else {
        console.error(`❌ Error: ${error.message}`)
      }
      process.exit(1)
    }
  }

  private showHelp(): void {
    console.log(`
Abode AI CLI - Command-line interface for Abode AI

USAGE:
  abodeai <command> [options]

COMMANDS:
  config           Manage configuration
    set-key        Set API key
    set-url        Set API base URL
    set-project    Set default project
    show           Show current configuration

  projects         Manage projects
    list           List all projects
    create         Create new project
    get            Get project details
    delete         Delete project

  models           Manage design models
    list           List models in project
    create         Create new model
    get            Get model details

  render           Manage rendering
    create         Create render job
    status         Check render status
    wait           Wait for render to complete

  energy           Energy simulation
    simulate       Run energy simulation
    report         Get simulation report

  bionic           Bionic design optimization
    optimize       Run bionic optimization
    results        Get optimization results

  blockchain       Blockchain integration
    register       Register material on blockchain
    verify         Verify supply chain
    provenance     Get material provenance

  arvr             AR/VR export
    export         Export project to AR/VR format

  twin             Digital twin management
    create         Create digital twin
    reading        Send sensor reading
    state          Get twin state

  marketplace      Marketplace operations
    search         Search for assets
    purchase       Purchase asset

  referrals        Referral system
    code           Get referral code
    stats          Get referral statistics
    leaderboard    View leaderboard

EXAMPLES:
  # Configure API key
  abodeai config set-key sk_abc123...

  # Create a new project
  abodeai projects create --name "My Building"

  # List all projects
  abodeai projects list

  # Create a render
  abodeai render create --project abc123 --model xyz789 --resolution 1920x1080

  # Search marketplace
  abodeai marketplace search --query "modern furniture"

  # Get referral stats
  abodeai referrals stats

For more information, visit: https://docs.abodeai.com/cli
`)
  }

  private loadConfig(): void {
    try {
      if (fs.existsSync(this.configPath)) {
        const data = fs.readFileSync(this.configPath, 'utf-8')
        this.config = JSON.parse(data)
      }
    } catch (error) {
      // Ignore config loading errors
    }
  }

  private saveConfig(): void {
    try {
      const dir = path.dirname(this.configPath)
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true })
      }
      fs.writeFileSync(this.configPath, JSON.stringify(this.config, null, 2))
      console.log('✅ Configuration saved')
    } catch (error: any) {
      console.error(`❌ Failed to save configuration: ${error.message}`)
      process.exit(1)
    }
  }

  private async handleConfig(args: string[]): Promise<void> {
    const [subcommand, ...subArgs] = args

    switch (subcommand) {
      case 'set-key':
        this.config.apiKey = subArgs[0]
        this.saveConfig()
        break
      case 'set-url':
        this.config.baseUrl = subArgs[0]
        this.saveConfig()
        break
      case 'set-project':
        this.config.defaultProjectId = subArgs[0]
        this.saveConfig()
        break
      case 'show':
        console.log('Current configuration:')
        console.log(JSON.stringify(this.config, null, 2))
        break
      default:
        console.error('Usage: abodeai config <set-key|set-url|set-project|show>')
        process.exit(1)
    }
  }

  private async handleProjects(args: string[]): Promise<void> {
    const [subcommand, ...subArgs] = args

    switch (subcommand) {
      case 'list': {
        const result = await this.client!.listProjects()
        console.table(result.projects.map(p => ({
          ID: p.id,
          Name: p.name,
          Status: p.status,
          Created: new Date(p.createdAt).toLocaleDateString()
        })))
        console.log(`\nTotal: ${result.total} projects`)
        break
      }
      case 'create': {
        const name = this.getArg(subArgs, '--name')
        const description = this.getArg(subArgs, '--description', '')
        const project = await this.client!.createProject({ name, description })
        console.log('✅ Project created')
        console.log(`   ID: ${project.id}`)
        console.log(`   Name: ${project.name}`)
        break
      }
      case 'get': {
        const id = subArgs[0] || this.config.defaultProjectId
        if (!id) throw new Error('Project ID required')
        const project = await this.client!.getProject(id)
        console.log(JSON.stringify(project, null, 2))
        break
      }
      case 'delete': {
        const id = subArgs[0]
        if (!id) throw new Error('Project ID required')
        await this.client!.deleteProject(id)
        console.log('✅ Project deleted')
        break
      }
      default:
        console.error('Usage: abodeai projects <list|create|get|delete>')
        process.exit(1)
    }
  }

  private async handleRender(args: string[]): Promise<void> {
    const [subcommand, ...subArgs] = args

    switch (subcommand) {
      case 'create': {
        const projectId = this.getArg(subArgs, '--project') || this.config.defaultProjectId
        const modelId = this.getArg(subArgs, '--model')
        const resolution = this.getArg(subArgs, '--resolution', '1920x1080')
        const [width, height] = resolution.split('x').map(Number)
        const samples = parseInt(this.getArg(subArgs, '--samples', '128'))

        if (!projectId || !modelId) {
          throw new Error('--project and --model are required')
        }

        const job = await this.client!.createRender({
          projectId,
          modelId,
          resolution: [width, height],
          samples
        })

        console.log('✅ Render job created')
        console.log(`   Job ID: ${job.id}`)
        console.log(`   Status: ${job.status}`)
        break
      }
      case 'status': {
        const jobId = subArgs[0]
        if (!jobId) throw new Error('Job ID required')
        const job = await this.client!.getRenderStatus(jobId)
        console.log(`Status: ${job.status}`)
        console.log(`Progress: ${job.progress}%`)
        if (job.outputUrl) {
          console.log(`Output: ${job.outputUrl}`)
        }
        break
      }
      case 'wait': {
        const jobId = subArgs[0]
        if (!jobId) throw new Error('Job ID required')
        console.log('Waiting for render to complete...')
        const job = await this.client!.waitForRender(jobId)
        console.log('✅ Render completed')
        console.log(`   Output: ${job.outputUrl}`)
        break
      }
      default:
        console.error('Usage: abodeai render <create|status|wait>')
        process.exit(1)
    }
  }

  private async handleReferrals(args: string[]): Promise<void> {
    const [subcommand] = args

    switch (subcommand) {
      case 'code': {
        const result = await this.client!.getReferralCode()
        console.log('Your referral code:')
        console.log(`   Code: ${result.code}`)
        console.log(`   URL: ${result.url}`)
        break
      }
      case 'stats': {
        const stats = await this.client!.getReferralStats()
        console.log('Referral Statistics:')
        console.log(`   Total Referrals: ${stats.totals.referrals}`)
        console.log(`   Completed: ${stats.totals.completedReferrals}`)
        console.log(`   Total Earned: ${stats.totals.totalEarned} credits`)
        console.log(`   Current Tier: ${stats.currentTier.name}`)
        if (stats.nextTier) {
          console.log(`   Progress to ${stats.nextTier.name}: ${Math.round((stats.progressToNextTier || 0) * 100)}%`)
        }
        break
      }
      case 'leaderboard': {
        const period = this.getArg(args, '--period', 'all-time')
        const leaderboard = await this.client!.getLeaderboard(period as any)
        console.log(`\n${period.toUpperCase()} Leaderboard:\n`)
        console.table(leaderboard.map(entry => ({
          Rank: entry.rank,
          User: entry.userName,
          Referrals: entry.stats.totalReferrals,
          Earned: entry.stats.totalEarned,
          Tier: entry.tier.name
        })))
        break
      }
      default:
        console.error('Usage: abodeai referrals <code|stats|leaderboard>')
        process.exit(1)
    }
  }

  private async handleMarketplace(args: string[]): Promise<void> {
    const [subcommand, ...subArgs] = args

    switch (subcommand) {
      case 'search': {
        const query = this.getArg(subArgs, '--query', '')
        const type = this.getArg(subArgs, '--type', undefined)
        const result = await this.client!.searchAssets({ query, type })

        console.log(`\nFound ${result.total} assets:\n`)
        console.table(result.assets.slice(0, 10).map((asset: any) => ({
          ID: asset.id,
          Name: asset.name,
          Type: asset.type,
          Price: `$${asset.pricing.price}`,
          Rating: `⭐ ${asset.stats.averageRating.toFixed(1)}`
        })))
        break
      }
      default:
        console.error('Usage: abodeai marketplace <search>')
        process.exit(1)
    }
  }

  private async handleEnergy(args: string[]): Promise<void> {
    console.log('Energy simulation commands coming soon...')
  }

  private async handleBionic(args: string[]): Promise<void> {
    console.log('Bionic optimization commands coming soon...')
  }

  private async handleBlockchain(args: string[]): Promise<void> {
    console.log('Blockchain commands coming soon...')
  }

  private async handleARVR(args: string[]): Promise<void> {
    console.log('AR/VR commands coming soon...')
  }

  private async handleDigitalTwin(args: string[]): Promise<void> {
    console.log('Digital twin commands coming soon...')
  }

  private async handleModels(args: string[]): Promise<void> {
    console.log('Model commands coming soon...')
  }

  private getArg(args: string[], flag: string, defaultValue?: any): any {
    const index = args.indexOf(flag)
    if (index === -1) return defaultValue
    return args[index + 1] || defaultValue
  }
}

// Run CLI
const cli = new AbodeAICLI()
cli.run(process.argv.slice(2)).catch(error => {
  console.error('Fatal error:', error.message)
  process.exit(1)
})
