'use client'
import React from 'react'
import { Star } from 'lucide-react'

const testimonials = [
    {
        name: "Sarah Johnson",
        role: "Project Manager at TechCorp",
        image: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah",
        content: "OneFlow transformed how we manage projects. We finally know if our projects are profitable in real-time, not months later. The billing engine saves us hours every week.",
        rating: 5
    },
    {
        name: "Michael Chen",
        role: "CEO at StartupHub",
        image: "https://api.dicebear.com/7.x/avataaars/svg?seed=Michael",
        content: "The integration between task management and financial tracking is genius. We can see exactly where our money is going and make better decisions faster.",
        rating: 5
    },
    {
        name: "Emily Rodriguez",
        role: "Finance Director at ConsultCo",
        image: "https://api.dicebear.com/7.x/avataaars/svg?seed=Emily",
        content: "As someone who deals with invoicing daily, the smart billing feature is a game-changer. No more double-billing mistakes or hunting for unbilled time sheets.",
        rating: 5
    },
    {
        name: "David Park",
        role: "Operations Manager at BuildRight",
        image: "https://api.dicebear.com/7.x/avataaars/svg?seed=David",
        content: "We used to juggle three different tools. OneFlow replaced them all and gave us better insights. Our profit margins have improved by 15% since switching.",
        rating: 5
    },
    {
        name: "Lisa Anderson",
        role: "Team Lead at DesignStudio",
        image: "https://api.dicebear.com/7.x/avataaars/svg?seed=Lisa",
        content: "The Kanban boards are intuitive, and logging time is effortless. My team actually enjoys using it, which says a lot about the UX.",
        rating: 5
    },
    {
        name: "James Wilson",
        role: "CFO at GrowthAgency",
        image: "https://api.dicebear.com/7.x/avataaars/svg?seed=James",
        content: "Finally, a tool that speaks both project manager and accountant language. The real-time profitability dashboard is exactly what we needed.",
        rating: 5
    }
]

export default function TestimonialsSection() {
    return (
        <section className="py-24 bg-background">
            <div className="max-w-7xl mx-auto px-6">
                <div className="text-center mb-16">
                    <h2 className="text-4xl md:text-5xl font-bold mb-4">
                        Loved by Project Managers
                    </h2>
                    <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                        See what our users have to say about OneFlow
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {testimonials.map((testimonial, index) => (
                        <div 
                            key={index}
                            className="bg-card border rounded-2xl p-6 hover:shadow-lg transition-shadow"
                        >
                            <div className="flex gap-1 mb-4">
                                {[...Array(testimonial.rating)].map((_, i) => (
                                    <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                                ))}
                            </div>
                            
                            <p className="text-muted-foreground mb-6">
                                &ldquo;{testimonial.content}&rdquo;
                            </p>

                            <div className="flex items-center gap-3">
                                <img 
                                    src={testimonial.image}
                                    alt={testimonial.name}
                                    className="w-12 h-12 rounded-full bg-muted"
                                />
                                <div>
                                    <p className="font-semibold">{testimonial.name}</p>
                                    <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    )
}
