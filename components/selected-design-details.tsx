"use client"

import Link from "next/link"
import Image from "next/image"
import { useState } from "react"
import { CheckCircle, Download, Home, MessageCircle, Play } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

interface SelectedDesignDetailsProps {
  onBack: () => void
  onContactArchitect: () => void
  onSaveDesign: () => void
  onExploreOther: () => void
}

export default function SelectedDesignDetails({
  onBack,
  onContactArchitect,
  onSaveDesign,
  onExploreOther,
}: SelectedDesignDetailsProps) {
  const [notes, setNotes] = useState("")

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="flex justify-between items-center p-4 md:p-6 bg-white">
        <button onClick={onBack} className="flex items-center space-x-2 hover:opacity-80 transition-opacity">
          <div className="w-8 h-8 bg-gradient-to-r from-orange-400 to-red-500 rounded-full flex items-center justify-center">
            <Home className="w-4 h-4 text-white" />
          </div>
          <span className="text-xl md:text-2xl font-bold text-black">aldeia</span>
        </button>
        <Link href="/" className="text-black hover:text-orange-500 font-medium text-sm md:text-base" prefetch={false}>
          HOME
        </Link>
      </nav>

      <div className="max-w-4xl mx-auto px-4 md:px-6 py-6 md:py-8">
        <div className="mb-4 md:mb-6">
          <p className="text-xs md:text-sm text-black mb-2">2743 SANTA ROSA AVE ALTADENA CA 91001-1940</p>
          <h1 className="text-2xl md:text-3xl font-bold text-black mb-2">Modern Farmhouse</h1>
          <p className="text-black mb-4 text-sm md:text-base">
            Homeowner&apos;s preferred style description: A blend of rustic charm and contemporary design, featuring clean
            lines, natural materials, and a focus on functionality and comfort.
          </p>

          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mb-4 md:mb-6">
            <Badge className="bg-green-500 text-white w-fit">88% match</Badge>
            <p className="text-xs md:text-sm text-black">This design closely aligns with your preferences.</p>
          </div>
        </div>

        {/* Main Design Image */}
        <div className="mb-6 md:mb-8">
          <h2 className="text-lg md:text-xl font-bold text-black mb-4">Your Pre-approved Design Match</h2>
          <Image
            src="/placeholder.svg?height=400&width=600&text=Modern+Farmhouse+Design"
            alt="Modern Farmhouse Design"
            className="mb-4 w-full rounded-lg shadow-lg"
            width={600}
            height={400}
          />
          <p className="text-black text-sm md:text-base">
            This Modern Farmhouse design offers a spacious open-concept living area, a gourmet kitchen, and a luxurious
            master suite. The exterior features a combination of wood and stone, creating a warm and inviting aesthetic.
            The design also includes energy-efficient features and smart home technology.
          </p>
        </div>

        {/* AI Generated Concept Video */}
        <div className="mb-6 md:mb-8">
          <h2 className="text-lg md:text-xl font-bold text-black mb-4">AI Generated Concept Video</h2>
          <div className="relative bg-gradient-to-b from-blue-200 to-teal-400 rounded-lg h-48 md:h-64 flex items-center justify-center">
            <Button
              size="lg"
              className="bg-white/20 hover:bg-white/30 text-white border-white/50"
              onClick={() => alert("Playing AI concept video...")}
            >
              <Play className="w-5 h-5 md:w-6 md:h-6 mr-2" />
              Play Video
            </Button>
          </div>
        </div>

        {/* Floor Plan */}
        <div className="mb-6 md:mb-8">
          <h2 className="text-lg md:text-xl font-bold text-black mb-4">Floor Plan</h2>
          <Image
            src="/placeholder.svg?height=400&width=600&text=Floor+Plan"
            alt="Floor Plan"
            className="mb-4 w-full rounded-lg shadow-lg"
            width={600}
            height={400}
          />
          <Button
            variant="outline"
            className="border-orange-500 text-orange-500 bg-transparent w-full sm:w-auto"
            onClick={() => alert("Downloading design files...")}
          >
            <Download className="w-4 h-4 mr-2" />
            Download Design
          </Button>
        </div>

        {/* Estimated Cost */}
        <div className="mb-6 md:mb-8">
          <h2 className="text-lg md:text-xl font-bold text-black mb-4">Estimated Cost</h2>
          <div className="text-xl md:text-2xl font-bold text-black mb-2">$750,000 - $850,000</div>
          <div className="flex items-center text-xs md:text-sm text-black">
            <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
            Pre-approved Certification
          </div>
        </div>

        {/* Insurance Coverage */}
        <div className="mb-6 md:mb-8">
          <h2 className="text-lg md:text-xl font-bold text-black mb-4">Insurance Coverage</h2>
          <p className="text-black text-sm md:text-base">
            Based on your property details, your insurance coverage is estimated at $500,000.
          </p>
        </div>

        {/* Go All Electric Discount */}
        <Card className="mb-6 md:mb-8 bg-orange-50 border-orange-200">
          <CardContent className="p-4">
            <h3 className="font-bold text-black mb-2 text-sm md:text-base">Go All Electric Discount</h3>
            <p className="text-black text-sm md:text-base">Save up to $5,000 on your rebuild</p>
          </CardContent>
        </Card>

        {/* Designer/Architect */}
        <div className="mb-6 md:mb-8">
          <h2 className="text-lg md:text-xl font-bold text-black mb-4">Designer/Architect</h2>
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 md:w-16 md:h-16 bg-gray-300 rounded-full flex items-center justify-center flex-shrink-0">
              <Image
                src="/placeholder.svg?height=64&width=64&text=SC"
                alt="Sophia Carter"
                className="h-12 w-12 rounded-full md:h-16 md:w-16"
                width={64}
                height={64}
              />
            </div>
            <div>
              <h3 className="font-bold text-black text-sm md:text-base">Sophia Carter</h3>
              <p className="text-black text-xs md:text-sm">Architect at RuralMod Designs</p>
            </div>
          </div>
        </div>

        {/* Notes Section */}
        <div className="mb-6 md:mb-8">
          <h2 className="text-lg md:text-xl font-bold text-black mb-4">Notes</h2>
          <textarea
            className="w-full bg-white p-4 rounded-lg border min-h-[100px] text-black text-sm md:text-base"
            placeholder="Add your notes here..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-4 sm:flex-row sm:justify-between">
          <div className="flex flex-col sm:flex-row gap-4">
            <Button className="bg-blue-500 hover:bg-blue-600 text-white" onClick={onContactArchitect}>
              Contact with Architect
            </Button>
            <Button
              variant="outline"
              className="border-orange-500 text-orange-500 bg-transparent"
              onClick={onSaveDesign}
            >
              Save Design
            </Button>
          </div>
          <Button
            variant="outline"
            className="border-orange-500 text-orange-500 bg-transparent"
            onClick={onExploreOther}
          >
            Explore Other Designs
          </Button>
        </div>
      </div>

      {/* Chatbot */}
      <div className="fixed bottom-4 right-4 md:bottom-6 md:right-6">
        <div className="w-12 h-12 md:w-14 md:h-14 bg-orange-500 rounded-full flex items-center justify-center cursor-pointer hover:bg-orange-600 transition-colors shadow-lg">
          <MessageCircle className="w-5 h-5 md:w-6 md:h-6 text-white" />
        </div>
      </div>
    </div>
  )
}
