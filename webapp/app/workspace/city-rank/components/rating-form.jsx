"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { getAuthHeaders } from "@/lib/api"
import { useSession } from "next-auth/react"

const ratingCategories = [
    { id: "costOfLiving", label: "Cost of Living", emoji: "💰", description: "Overall affordability" },
    { id: "safety", label: "Safety", emoji: "🛡️", description: "General security" },
    { id: "transportation", label: "Transportation", emoji: "🚗", description: "Public transport quality" },
    { id: "healthcare", label: "Healthcare", emoji: "🏥", description: "Medical care quality" },
    { id: "food", label: "Food Quality", emoji: "🍽️", description: "Local cuisine and food safety" },
    { id: "nightlife", label: "Nightlife", emoji: "🍸", description: "Night entertainment options" },
    { id: "culture", label: "Culture", emoji: "🎭", description: "Cultural attractions and events" },
    { id: "outdoorActivities", label: "Outdoor Activities", emoji: "🌳", description: "Parks, hiking, outdoor fun" },
]

const ratingLabels = ["Bad", "Okay", "Good", "Great", "Amazing"]

export default function ComprehensiveRatingForm({ cityName = "Colombo", selectedCity, userId = "guest-user" }) {
    const [ratings, setRatings] = useState({})
    const [review, setReview] = useState("")
    const { data: session } = useSession()
    const displayCityName = selectedCity?.name || cityName
    const actualUserId = session?.user?.id || userId

    const handleRatingChange = (categoryId, rating) => {
        setRatings((prev) => ({ ...prev, [categoryId]: rating }))
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (!selectedCity?.cityId) return

        // Map UI ratings to exact backend schema
        const payload = {
            userId: actualUserId,
            ratings: {
                costOfLiving: Number(ratings.costOfLiving || 3),
                safety: Number(ratings.safety || 3),
                transportation: Number(ratings.transportation || 3),
                healthcare: Number(ratings.healthcare || 3),
                food: Number(ratings.food || 3),
                nightlife: Number(ratings.nightlife || 3),
                culture: Number(ratings.culture || 3),
                outdoorActivities: Number(ratings.outdoorActivities || 3),
            },
            reviewText: review || undefined,
        }

        try {
            const res = await fetch(`http://localhost:8080/api/cities/${selectedCity.cityId}/ratings`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...getAuthHeaders(session) },
                body: JSON.stringify(payload),
            })
            const data = await res.json()
            if (res.ok && data?.success) {
                setRatings({})
                setReview("")
                alert('Thanks for rating!')
            } else {
                alert(data?.message || 'Failed to submit rating')
            }
        } catch (e) {
            console.error('Failed to submit rating', e)
            alert('Failed to submit rating')
        }
    }

    return (
        <Card className="w-full">
            <CardHeader className="px-12 pt-8">
                <CardTitle className="text-3xl font-bold text-left">Rate {displayCityName}</CardTitle>
                <p className="text-lg text-muted-foreground text-left">Share your experience and help other travelers</p>
            </CardHeader>
            <CardContent className="px-12 pb-8">
                <form onSubmit={handleSubmit} className="space-y-10">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-3 gap-y-8">
                        {ratingCategories.map((category) => (
                            <div key={category.id} className="space-y-4">
                                <div className="flex items-start gap-4">
                                    <span className="text-2xl mt-1">{category.emoji}</span>
                                    <div className="flex-1">
                                        <h4 className="text-lg font-semibold mb-1">{category.label}</h4>
                                        <p className="text-base text-muted-foreground leading-relaxed">{category.description}</p>
                                    </div>
                                </div>
                                <div className="flex gap-2 ml-12">
                                    {ratingLabels.map((label, index) => (
                                        <button
                                            key={index}
                                            type="button"
                                            onClick={() => handleRatingChange(category.id, index + 1)}
                                            className={`px-4 py-2 text-sm font-medium rounded-lg border transition-colors ${ratings[category.id] === index + 1
                                                ? "bg-primary text-primary-foreground border-primary"
                                                : "bg-background hover:bg-muted border-border"
                                                }`}
                                        >
                                            {label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="space-y-4 pt-4">
                        <label className="text-lg font-semibold">Additional Comments</label>
                        <Textarea
                            placeholder="Share your detailed experience about living in or visiting this city..."
                            value={review}
                            onChange={(e) => setReview(e.target.value)}
                            className="min-h-[120px] text-base"
                        />
                    </div>

                    <Button type="submit" className="w-full text-lg py-3 mt-8">
                        Submit Rating
                    </Button>
                </form>
            </CardContent>
        </Card>
    )
}