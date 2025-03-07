"use client"
import { ArrowRight } from "lucide-react"
import { Card, CardContent } from "../../components/ui/card"
import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { useRouter } from "next/navigation"
import { useGetLocationsByUserIdQuery, useGetUserQuery } from "../../state/api"

// Define Location type based on the Prisma schema
interface Location {
    id: string;
    name: string;
    address?: string;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
    agencyId: string;
}

const Tile = ({ title, onClick, isSelected }: { title: string; onClick: () => void; isSelected?: boolean }) => {
    return (
        <motion.div
            className={` flex flex-row  font-medium items-center justify-between w-full h-full rounded-lg p-4   hover:bg-gray-100 cursor-pointer mt-2`}
            onClick={onClick}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            transition={{ duration: 0.2 }}
        >
            {title}
            <ArrowRight className="w-4 h-4" />
        </motion.div>
    )
}

const LocationPage = () => {
    const router = useRouter()
    const { data: user } = useGetUserQuery()
    const [selectedLocation, setSelectedLocation] = useState<Location | null>(null)
    const [locations, setLocations] = useState<Location[]>([])
    const { data: locationsData } = useGetLocationsByUserIdQuery(user?.userInfo.id || "", {
        skip: !user?.userInfo.id
    })

    useEffect(() => {
        if (locationsData) {
            setLocations(locationsData as unknown as Location[])
        }
    }, [locationsData])

    useEffect(() => {
        if (user && user.userInfo.role !== "SOFTWARE_OWNER") {
            router.push("/unauthorized")
        }
    }, [user, router])

    // If user is not loaded yet or not a SOFTWARE_OWNER, don't render the page content
    if (!user || user.userInfo.role !== "SOFTWARE_OWNER") {
        return <div className="flex items-center justify-center h-screen">Loading...</div>
    }

    return (
        <div className="flex flex-col items-center justify-start h-screen gap-2  pt-10">
            <h1 className="text-4xl font-bold m-10">AI-Powered Patient Management</h1>
            <div className="flex flex-col items-center justify-start h-screen gap-2">
                <h1 className="text-2xl font-bold">Select Location</h1>
                <p className="text-muted-foreground text-sm">
                    You are attached to multiple locations. Please select the location you want to manage.
                </p>
                <Card className="w-full max-w-lg mt-4">
                    <CardContent>
                        {locations.map((location: Location) => {
                            return (
                                <Tile
                                    key={location.id}
                                    onClick={() => {
                                        setSelectedLocation(location)
                                        router.push(`/location/${location.id}`)
                                    }}
                                    title={location.name}
                                    isSelected={selectedLocation?.id === location.id}
                                />
                            )
                        })}
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}

export default LocationPage
