"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Loader2, Star, MapPin, Users, TrendingUp, Filter, Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import AIChatInterface from "./components/ai-chat-interface"
import { useSession } from "next-auth/react"
import { getAuthHeaders } from "@/lib/api"

export default function CityRankPage() {
    const router = useRouter()
    const { data: session } = useSession()
    const [cities, setCities] = useState([])
    const [filteredCities, setFilteredCities] = useState([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState("")
    const [sortBy, setSortBy] = useState("rank")
    const [categoryFilter, setCategoryFilter] = useState("all")

    useEffect(() => {
        const fetchCities = async () => {
            try {
                setLoading(true)
                
                // Fetch cities
                const citiesRes = await fetch('http://localhost:8080/api/cities', { 
                    cache: 'no-store', 
                    headers: { ...getAuthHeaders(session) } 
                })
                const citiesData = await citiesRes.json()
                
                if (citiesData?.success && Array.isArray(citiesData.data)) {
                    const mapped = citiesData.data.map((c) => ({
                        id: c.cityId || c.city_id || c.id,
                        name: c.name,
                        slug: c.slug,
                        image: c.firstImageUrl || (Array.isArray(c.imageUrls) && c.imageUrls.length > 0 ? c.imageUrls[0] : c.image) || "/placeholder.svg",
                        rating: c.overallRating ?? c.rating ?? 0,
                        description: c.description ?? "",
                        rank: c.rankPosition ?? c.rank ?? 0,
                        totalRatings: c.totalRatings ?? 0,
                        category: c.category || "Unknown",
                    }))
                    setCities(mapped)
                    setFilteredCities(mapped)
                } else {
                    setCities([])
                    setFilteredCities([])
                }
            } catch (error) {
                console.error('Error fetching cities:', error)
                setCities([])
                setFilteredCities([])
            } finally {
                setLoading(false)
            }
        }

        fetchCities()
    }, [])

    // Filter and sort cities
    useEffect(() => {
        let result = [...cities]
        
        // Apply search filter
        if (searchTerm) {
            const term = searchTerm.toLowerCase()
            result = result.filter(city => 
                city.name.toLowerCase().includes(term) || 
                city.description.toLowerCase().includes(term) ||
                city.category.toLowerCase().includes(term)
            )
        }
        
        // Apply category filter
        if (categoryFilter !== "all") {
            result = result.filter(city => city.category === categoryFilter)
        }
        
        // Apply sorting
        switch (sortBy) {
            case "rank":
                result.sort((a, b) => a.rank - b.rank)
                break
            case "rating":
                result.sort((a, b) => b.rating - a.rating)
                break
            case "name":
                result.sort((a, b) => a.name.localeCompare(b.name))
                break
            case "reviews":
                result.sort((a, b) => b.totalRatings - a.totalRatings)
                break
            default:
                break
        }
        
        setFilteredCities(result)
    }, [cities, searchTerm, sortBy, categoryFilter])

    // Get unique categories for filter dropdown
    const categories = ["all", ...new Set(cities.map(city => city.category))]

    if (loading) {
        return (
            <div className="min-h-screen bg-background">
                <div className="max-w-6xl mx-auto px-4 py-8">
                    <div className="flex items-center justify-center min-h-96">
                        <div className="text-center">
                            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
                            <p className="text-muted-foreground">Loading cities...</p>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-background">
            <div className="container mx-auto px-8 py-6">
                <div className="mb-8 pt-3 text-left">
                    <h1 className="text-3xl font-semibold tracking-tight text-foreground">Where Should You Be? 🤔</h1>
                    <p className="text-muted-foreground mt-1">Discover cities through community rankings, ratings, and hidden stories.</p>
                </div>

                {/* Filters Section */}
                <div className="mb-6 p-4 bg-card rounded-lg border">
                    <div className="flex flex-col md:flex-row gap-4 items-end">
                        <div className="flex-1">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                                <Input
                                    placeholder="Search cities..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-10"
                                />
                            </div>
                        </div>
                        
                        <div className="w-full md:w-48">
                            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Category" />
                                </SelectTrigger>
                                <SelectContent>
                                    {categories.map((category) => (
                                        <SelectItem key={category} value={category}>
                                            {category === "all" ? "All Categories" : category}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        
                        <div className="w-full md:w-48">
                            <Select value={sortBy} onValueChange={setSortBy}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Sort by" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="rank">Rank</SelectItem>
                                    <SelectItem value="rating">Rating</SelectItem>
                                    <SelectItem value="name">Name</SelectItem>
                                    <SelectItem value="reviews">Number of Reviews</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        
                        <Button
                            onClick={() => {
                                setSearchTerm("")
                                setCategoryFilter("all")
                                setSortBy("rank")
                            }}
                            variant="outline"
                            className="flex items-center gap-2"
                        >
                            <Filter className="h-4 w-4" />
                            Clear Filters
                        </Button>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="flex justify-between items-center">
                        <h2 className="text-2xl font-bold">Top Cities {filteredCities.length > 0 && `(${filteredCities.length})`}</h2>
                        <Button
                            onClick={() => router.push("/workspace/city-rank/add-city")}
                            className="bg-primary hover:opacity-90 text-primary-foreground"
                        >
                            Add New City
                        </Button>
                    </div>

                    {filteredCities.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {filteredCities.map((city, index) => (
                                <div
                                    key={city.id}
                                    className="cursor-pointer group border rounded-xl overflow-hidden hover:shadow-lg transition-all duration-300"
                                    onClick={() => router.push(`/workspace/city-rank/${city.slug}`)}
                                >
                                    <div className="relative">
                                        <img
                                            src={city.image}
                                            alt={city.name}
                                            className="w-full h-48 object-cover transition-transform duration-500 group-hover:scale-105"
                                        />
                                        <Badge className="absolute top-2 left-2 bg-amber-500 text-white">
                                            #{city.rank}
                                        </Badge>
                                    </div>

                                    <div className="p-4 space-y-2">
                                        <div className="flex items-center justify-between">
                                            <h3 className="font-semibold text-foreground truncate">
                                                {city.name}
                                            </h3>
                                            <div className="flex items-center gap-1">
                                                <Star className="w-4 h-4 fill-current text-amber-500" />
                                                <span className="text-sm font-medium">{city.rating.toFixed(1)}</span>
                                            </div>
                                        </div>
                                        <p className="text-muted-foreground text-sm line-clamp-2">
                                            {city.description}
                                        </p>
                                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                                            <span>{city.totalRatings || 0} ratings</span>
                                            <span className="flex items-center gap-1">
                                                <TrendingUp className="w-3 h-3" />
                                                {city.rank > 0 ? `Rank ${city.rank}` : 'New'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="py-16">
                            <div className="max-w-xl mx-auto rounded-lg border border-border bg-card p-5 sm:p-6 text-center">
                                <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                                <div className="text-base sm:text-lg font-semibold text-foreground mb-2">No cities found</div>
                                <p className="mt-1 text-sm sm:text-base text-muted-foreground mb-6">
                                    Try adjusting your filters or search terms to find what you're looking for.
                                </p>
                                <Button
                                    onClick={() => {
                                        setSearchTerm("")
                                        setCategoryFilter("all")
                                        setSortBy("rank")
                                    }}
                                    variant="outline"
                                    className="mr-2"
                                >
                                    Clear Filters
                                </Button>
                                <Button
                                    onClick={() => router.push("/workspace/city-rank/add-city")}
                                    className="bg-primary hover:opacity-90 text-primary-foreground"
                                >
                                    Add Your First City
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <AIChatInterface />
        </div>
    )
}