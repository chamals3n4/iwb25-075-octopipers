"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { MapPin, Star, ArrowLeft, Loader2 } from "lucide-react"
import CityOverview from "../components/city-overview"
import ComprehensiveRatingForm from "../components/rating-form"
import ChatInterface from "../components/chat-interface"
import { useSession } from "next-auth/react"
import { getAuthHeaders } from "@/lib/api"

// Cities data - initially empty, will be populated by user additions
const sriLankanCities = []

export default function CityDetailPage({ params }) {
    const router = useRouter()
    const [activeTab, setActiveTab] = useState("overview")
    const [city, setCity] = useState(null)
    const [loading, setLoading] = useState(true)
    const { data: session } = useSession()

    useEffect(() => {
        const fetchCity = async () => {
            try {
                const res = await fetch(`http://localhost:8080/api/cities/${params.slug}`, { cache: 'no-store', headers: { ...getAuthHeaders(session) } })
                const data = await res.json()
                if (data?.success && data.data) {
                    const c = data.data
                    const mapped = {
                        cityId: c.cityId || c.city_id,
                        name: c.name,
                        slug: c.slug,
                        category: c.category,
                        description: c.description,
                        rating: c.overallRating ?? c.rating ?? 0,
                        rank: c.rankPosition ?? c.rank ?? 0,
                        images: Array.isArray(c.imageUrls) ? c.imageUrls : [],
                        image: Array.isArray(c.imageUrls) && c.imageUrls.length > 0 ? c.imageUrls[0] : "/placeholder.svg",
                        amenities: c.amenities || [], // Keep amenities as is, let CityOverview handle parsing
                        population: c.population ?? 0,
                        temperature: c.temperature ?? 0,
                        ratingsBreakdown: c.ratingsBreakdown || {},
                        totalRatings: c.totalRatings ?? 0,
                        costOfLiving: c.costOfLiving ?? 0,
                        safety: c.safety ?? 0,
                        transportation: c.transportation ?? 0,
                        healthcare: c.healthcare ?? 0,
                        food: c.food ?? 0,
                        nightlife: c.nightlife ?? 0,
                        culture: c.culture ?? 0,
                        outdoorActivities: c.outdoorActivities ?? 0,
                        internetSpeed: c.internetSpeed ?? 0,
                    }
                    setCity(mapped)
                } else {
                    setCity(null)
                }
            } catch (error) {
                console.error('Error fetching city:', error)
                setCity(null)
            } finally {
                setLoading(false)
            }
        }

        fetchCity()
    }, [params.slug])

    if (loading) {
        return (
            <div className="min-h-screen bg-background">
                <div className="max-w-6xl mx-auto px-4 py-8">
                    <div className="flex items-center justify-center min-h-96">
                        <div className="text-center">
                            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
                            <p className="text-muted-foreground">Loading city details...</p>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    if (!city) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="text-center">
                    <MapPin className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                    <h1 className="text-2xl font-bold mb-4">City Not Found</h1>
                    <p className="text-muted-foreground mb-4">
                        The city you're looking for doesn't exist yet. Start by adding cities to the database.
                    </p>
                    <Button onClick={() => router.push("/workspace/city-rank")}>
                        Back to Cities
                    </Button>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-background">
            <div className="container mx-auto px-8 py-6">
                {/* Back Button */}
                <Button
                    variant="outline"
                    onClick={() => router.push("/workspace/city-rank")}
                    className="mb-6"
                >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Cities
                </Button>

                {/* City Header */}
                <div className="text-center mb-6">
                    <h1 className="text-3xl font-bold mb-2">{city.name}</h1>
                    <div className="flex items-center justify-center gap-4 text-muted-foreground">
                        <div className="flex items-center gap-1">
                            <MapPin className="w-4 h-4" />
                            <span>{city.category}</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <Star className="w-4 h-4 fill-current text-amber-500" />
                            <span>{city.rating.toFixed(1)}</span>
                        </div>
                        <Badge className="bg-amber-500 text-white">
                            Rank #{city.rank > 0 ? city.rank : 'N/A'}
                        </Badge>
                    </div>
                </div>

                {/* Photo Gallery - 4 Images in One Line */}
                <div className="mb-6">
                    <div className="grid grid-cols-4 gap-4">
                        {Array.from({ length: 4 }).map((_, i) => (
                            <div key={i} className="aspect-square bg-muted rounded-lg overflow-hidden">
                                <img
                                    src={city.images?.[i] || city.image || "/placeholder.svg"}
                                    alt={`${city.name} ${i + 1}`}
                                    className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                                />
                            </div>
                        ))}
                    </div>
                </div>

                <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="overview">
                            Overview
                        </TabsTrigger>
                        <TabsTrigger value="rate">
                            Rate City
                        </TabsTrigger>
                        <TabsTrigger value="chat">
                            Community Chat
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="overview" className="space-y-6">
                        <CityOverview selectedCity={city} />
                    </TabsContent>

                    <TabsContent value="rate">
                        <ComprehensiveRatingForm cityName={city.name} selectedCity={city} userId="guest-user" />
                    </TabsContent>

                    <TabsContent value="chat">
                        <ChatInterface cityId={city.cityId} userId="guest-user" userName="Guest" />
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    )
}