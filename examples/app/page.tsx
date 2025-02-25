import Image from "next/image"
import Link from "next/link"
import { Eye, Heart, ListPlus, Star } from "lucide-react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-black text-white">
      {/* Hero Section */}
      <div className="relative h-[60vh] w-full">
        <Image
          src="/placeholder.svg?height=600&width=400"
          alt="Strain Hero"
          fill
          className="object-cover brightness-75"
          priority
        />
        <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black to-transparent">
          <h1 className="text-4xl font-bold mb-2">Purple Haze</h1>
          <p className="text-emerald-400 mb-4">Sativa • THC 22% • CBD 1%</p>

          <div className="flex gap-4 mb-6">
            <Button variant="outline" className="flex-1 bg-black/50 border-emerald-500 hover:bg-emerald-500/20">
              <Eye className="mr-2 h-4 w-4" />
              Try
            </Button>
            <Button variant="outline" className="flex-1 bg-black/50 border-emerald-500 hover:bg-emerald-500/20">
              <Heart className="mr-2 h-4 w-4" />
              Like
            </Button>
            <Button variant="outline" className="flex-1 bg-black/50 border-emerald-500 hover:bg-emerald-500/20">
              <ListPlus className="mr-2 h-4 w-4" />
              List
            </Button>
          </div>

          <div className="space-y-4">
            <div className="flex justify-center">
              <div className="flex">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star key={star} className="w-8 h-8 text-emerald-500 fill-emerald-500" />
                ))}
              </div>
            </div>
            <Button className="w-full bg-emerald-500 hover:bg-emerald-600">Review or log</Button>
          </div>
        </div>
      </div>

      {/* Content Tabs */}
      <Tabs defaultValue="details" className="w-full">
        <TabsList className="w-full justify-start bg-black border-b border-white/10 rounded-none h-12">
          <TabsTrigger value="details" className="text-white data-[state=active]:text-emerald-500">
            Details
          </TabsTrigger>
          <TabsTrigger value="reviews" className="text-white data-[state=active]:text-emerald-500">
            Reviews
          </TabsTrigger>
          <TabsTrigger value="similar" className="text-white data-[state=active]:text-emerald-500">
            Similar
          </TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="p-6">
          <div className="space-y-4">
            <p className="text-lg text-white/80">
              A legendary sativa-dominant strain known for its sweet aroma and energetic, creative effects.
            </p>
            <div className="grid grid-cols-2 gap-4">
              <Card className="bg-zinc-900 border-zinc-800">
                <CardHeader className="text-sm text-white/60">Effects</CardHeader>
                <CardContent className="text-emerald-400">Euphoric, Creative, Uplifting</CardContent>
              </Card>
              <Card className="bg-zinc-900 border-zinc-800">
                <CardHeader className="text-sm text-white/60">Flavor</CardHeader>
                <CardContent className="text-emerald-400">Berry, Earthy, Sweet</CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="reviews" className="p-6">
          <div className="space-y-6">
            {[1, 2, 3].map((review) => (
              <div key={review} className="flex gap-4">
                <Avatar className="w-10 h-10">
                  <AvatarImage src={`/placeholder.svg?text=U${review}`} />
                  <AvatarFallback>U{review}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium">User{review}</span>
                    <div className="flex">
                      {[1, 2, 3, 4].map((star) => (
                        <Star key={star} className="w-4 h-4 text-emerald-500 fill-emerald-500" />
                      ))}
                    </div>
                  </div>
                  <p className="text-white/80">Great strain for creative work and socializing!</p>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 h-16 bg-zinc-900 border-t border-white/10 flex items-center justify-around px-4">
        <Link href="#" className="text-emerald-500">
          <div className="flex flex-col items-center">
            <Eye className="h-6 w-6" />
            <span className="text-xs">Diary</span>
          </div>
        </Link>
        <Link href="#" className="text-white/60">
          <div className="flex flex-col items-center">
            <ListPlus className="h-6 w-6" />
            <span className="text-xs">Lists</span>
          </div>
        </Link>
        <Button size="icon" className="h-12 w-12 rounded-full bg-emerald-500 hover:bg-emerald-600 -translate-y-4">
          +
        </Button>
        <Link href="#" className="text-white/60">
          <div className="flex flex-col items-center">
            <Heart className="h-6 w-6" />
            <span className="text-xs">Likes</span>
          </div>
        </Link>
        <Link href="#" className="text-white/60">
          <div className="flex flex-col items-center">
            <Avatar className="h-6 w-6">
              <AvatarFallback>U</AvatarFallback>
            </Avatar>
            <span className="text-xs">Profile</span>
          </div>
        </Link>
      </div>
    </div>
  )
}

