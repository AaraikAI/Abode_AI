import { config as loadEnv } from "dotenv"

loadEnv({ path: ".env.local", override: false })
loadEnv({ path: ".env.test", override: true })

import "@testing-library/jest-dom"

import matchers from "@testing-library/jest-dom/matchers"
import { expect } from "@jest/globals"

expect.extend(matchers)
