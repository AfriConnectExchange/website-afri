'use client';
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle } from "lucide-react";
import { motion } from 'framer-motion';

export function CompletionStep() {
    return (
        <Card>
            <CardContent className="pt-6 text-center">
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 260, damping: 20 }}
                    className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4"
                >
                    <CheckCircle className="w-8 h-8 text-green-600" />
                </motion.div>
                <h3 className="text-xl font-semibold mb-2">You're All Set!</h3>
                <p className="text-muted-foreground mb-6">
                    Your profile has been successfully created. Redirecting you to the marketplace...
                </p>
            </CardContent>
        </Card>
    );
}
