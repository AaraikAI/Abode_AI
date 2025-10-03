"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Slider } from "@/components/ui/slider"
import { Badge } from "@/components/ui/badge"
import { AldeiaAdvisorChatbot } from "@/components/AldeiaAdvisorChatbot"
import SelectedDesignDetails from "@/components/selected-design-details"
// Import other components as needed...

export default function RebuildFlow() {
  const [currentStep, setCurrentStep] = useState("home")
  const [selectedLocation, setSelectedLocation] = useState("")
  const [selectedStyle, setSelectedStyle] = useState("")
  const [selectedNeeds, setSelectedNeeds] = useState<string[]>([])
  const [selectedBudget, setSelectedBudget] = useState("")

  // Navigation handler for chatbot
  const handleChatbotNavigation = (step: string) => {
    setCurrentStep(step)
  }

  const renderHome = () => (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Your existing home content */}
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold mb-4">Rebuild Your Home</h1>
          <p className="text-xl text-gray-600 mb-8">
            Let's start your journey to rebuilding after the fire.
          </p>
          
          <Card className="p-6">
            <h2 className="text-2xl font-semibold mb-4">Welcome to Your Rebuild Journey</h2>
            <p className="mb-6">We'll guide you through each step of the process.</p>
            <Button 
              onClick={() => setCurrentStep("location")}
              className="bg-orange-500 hover:bg-orange-600"
            >
              Get Started
            </Button>
          </Card>
        </div>
      </div>

      {/* Integrated Chatbot */}
      <AldeiaAdvisorChatbot 
        currentStep={currentStep}
        onStepNavigation={handleChatbotNavigation}
      />
    </div>
  )

  const renderLocationConfirmation = () => (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-4">Confirm Your Property Location</h1>
          
          <Card className="p-6">
            {/* Your existing location content */}
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Enter your address..."
                className="w-full p-3 border rounded-lg"
                value={selectedLocation}
                onChange={(e) => setSelectedLocation(e.target.value)}
              />
              <div className="flex gap-4">
                <Button 
                  variant="outline"
                  onClick={() => setCurrentStep("home")}
                >
                  Back
                </Button>
                <Button 
                  onClick={() => setCurrentStep("style")}
                  className="bg-orange-500 hover:bg-orange-600"
                  disabled={!selectedLocation}
                >
                  Continue
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>

      <AldeiaAdvisorChatbot 
        currentStep={currentStep}
        onStepNavigation={handleChatbotNavigation}
      />
    </div>
  )

  const renderStyleSelection = () => (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-4">Select Your Architectural Style</h1>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            {["Modern", "Traditional", "Mediterranean", "Craftsman", "Ranch", "Contemporary"].map((style) => (
              <Card
                key={style}
                className={`p-4 cursor-pointer transition-all ${
                  selectedStyle === style ? "ring-2 ring-orange-500" : ""
                }`}
                onClick={() => setSelectedStyle(style)}
              >
                <h3 className="font-semibold">{style}</h3>
                <p className="text-sm text-gray-600">
                  Fire-resistant {style.toLowerCase()} design
                </p>
              </Card>
            ))}
          </div>

          <div className="flex gap-4">
            <Button 
              variant="outline"
              onClick={() => setCurrentStep("location")}
            >
              Back
            </Button>
            <Button 
              onClick={() => setCurrentStep("inspiration")}
              className="bg-orange-500 hover:bg-orange-600"
              disabled={!selectedStyle}
            >
              Continue
            </Button>
          </div>
        </div>
      </div>

      <AldeiaAdvisorChatbot 
        currentStep={currentStep}
        onStepNavigation={handleChatbotNavigation}
      />
    </div>
  )

  const renderInspiration = () => (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-4">Find Your Inspiration</h1>
          
          <Card className="p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Browse Design Ideas</h2>
            <p className="text-gray-600 mb-4">
              Explore designs that match your selected {selectedStyle} style.
            </p>
            {/* Add inspiration gallery here */}
          </Card>

          <div className="flex gap-4">
            <Button 
              variant="outline"
              onClick={() => setCurrentStep("style")}
            >
              Back
            </Button>
            <Button 
              onClick={() => setCurrentStep("needs")}
              className="bg-orange-500 hover:bg-orange-600"
            >
              Continue
            </Button>
          </div>
        </div>
      </div>

      <AldeiaAdvisorChatbot 
        currentStep={currentStep}
        onStepNavigation={handleChatbotNavigation}
      />
    </div>
  )

  const renderNeedsSelection = () => (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-4">Select Your Needs</h1>
          
          <div className="space-y-3 mb-8">
            {[
              "ADU (Accessory Dwelling Unit)",
              "Solar Panels",
              "EV Charging Station",
              "Home Office",
              "Accessibility Features",
              "Pool/Spa",
              "Workshop/Garage"
            ].map((need) => (
              <Card
                key={need}
                className={`p-4 cursor-pointer transition-all ${
                  selectedNeeds.includes(need) ? "ring-2 ring-orange-500" : ""
                }`}
                onClick={() => {
                  setSelectedNeeds(prev =>
                    prev.includes(need)
                      ? prev.filter(n => n !== need)
                      : [...prev, need]
                  )
                }}
              >
                <div className="flex items-center justify-between">
                  <span>{need}</span>
                  {selectedNeeds.includes(need) && (
                    <span className="text-orange-500">✓</span>
                  )}
                </div>
              </Card>
            ))}
          </div>

          <div className="flex gap-4">
            <Button 
              variant="outline"
              onClick={() => setCurrentStep("inspiration")}
            >
              Back
            </Button>
            <Button 
              onClick={() => setCurrentStep("budget")}
              className="bg-orange-500 hover:bg-orange-600"
            >
              Continue
            </Button>
          </div>
        </div>
      </div>

      <AldeiaAdvisorChatbot 
        currentStep={currentStep}
        onStepNavigation={handleChatbotNavigation}
      />
    </div>
  )

  const renderBudgetSelection = () => (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-4">Set Your Budget</h1>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            {[
              { range: "$300k - $500k", value: "300-500" },
              { range: "$500k - $750k", value: "500-750" },
              { range: "$750k - $1M", value: "750-1000" },
              { range: "$1M+", value: "1000+" }
            ].map((budget) => (
              <Card
                key={budget.value}
                className={`p-6 cursor-pointer transition-all ${
                  selectedBudget === budget.value ? "ring-2 ring-orange-500" : ""
                }`}
                onClick={() => setSelectedBudget(budget.value)}
              >
                <h3 className="font-semibold text-lg">{budget.range}</h3>
                <p className="text-sm text-gray-600 mt-2">
                  Includes construction and permits
                </p>
              </Card>
            ))}
          </div>

          <div className="flex gap-4">
            <Button 
              variant="outline"
              onClick={() => setCurrentStep("needs")}
            >
              Back
            </Button>
            <Button 
              onClick={() => setCurrentStep("matches")}
              className="bg-orange-500 hover:bg-orange-600"
              disabled={!selectedBudget}
            >
              View Matches
            </Button>
          </div>
        </div>
      </div>

      <AldeiaAdvisorChatbot 
        currentStep={currentStep}
        onStepNavigation={handleChatbotNavigation}
      />
    </div>
  )

  const renderDesignMatches = () => (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-4">Your Design Matches</h1>
          
          <div className="mb-6">
            <Card className="p-4 bg-orange-50 border-orange-200">
              <p className="text-sm">
                Based on your selections: {selectedStyle} style, 
                Budget: ${selectedBudget}k, 
                {selectedNeeds.length > 0 && ` with ${selectedNeeds.join(", ")}`}
              </p>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {/* Add your design match cards here */}
            {[1, 2, 3, 4].map((design) => (
              <Card key={design} className="p-4">
                <div className="h-48 bg-gray-200 rounded mb-4"></div>
                <h3 className="font-semibold">Design Option {design}</h3>
                <p className="text-sm text-gray-600">
                  Matches your criteria • Fire-resistant
                </p>
                <Button 
                  className="mt-4 w-full"
                  onClick={() => setCurrentStep("details")}
                >
                  View Details
                </Button>
              </Card>
            ))}
          </div>

          <div className="flex gap-4">
            <Button 
              variant="outline"
              onClick={() => setCurrentStep("budget")}
            >
              Back
            </Button>
          </div>
        </div>
      </div>

      <AldeiaAdvisorChatbot 
        currentStep={currentStep}
        onStepNavigation={handleChatbotNavigation}
      />
    </div>
  )

  const renderDetails = () => (
    <div className="min-h-screen bg-gray-50">
      <SelectedDesignDetails
        onBack={() => setCurrentStep("matches")}
        onContactArchitect={() => alert("Contact architect functionality")}
        onSaveDesign={() => alert("Save design functionality")}
        onExploreOther={() => setCurrentStep("matches")}
      />
      
      <AldeiaAdvisorChatbot 
        currentStep={currentStep}
        onStepNavigation={handleChatbotNavigation}
      />
    </div>
  )

  const steps = {
    home: renderHome,
    location: renderLocationConfirmation,
    style: renderStyleSelection,
    inspiration: renderInspiration,
    needs: renderNeedsSelection,
    budget: renderBudgetSelection,
    matches: renderDesignMatches,
    details: renderDetails,
  }

  return steps[currentStep as keyof typeof steps]()
}