
"use client";

import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { ListChecks, Users } from "lucide-react";

interface HowToVoteDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  round: number;
}

export function HowToVoteDialog({ isOpen, onClose, onConfirm, round }: HowToVoteDialogProps) {
  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex flex-col items-center gap-4 text-2xl font-headline">
            Voting Round {round} is about to begin!
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="text-base text-center py-4 space-y-4">
              <div>Get ready to cast your vote. Here are the rules:</div>
              <ul className="text-left list-none space-y-3 bg-secondary p-4 rounded-lg">
                  <li className="flex items-start gap-3">
                      <ListChecks className="w-5 h-5 text-primary mt-1 shrink-0" />
                      <span>Each player must vote for one person. No skipping!</span>
                  </li>
                  <li className="flex items-start gap-3">
                      <Users className="w-5 h-5 text-destructive mt-1 shrink-0" />
                      <span>Any player who receives <strong className="text-primary-foreground">3 or more votes</strong> will be eliminated.</span>
                  </li>
              </ul>
              <div>You have 30 seconds. Make it count!</div>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="sm:justify-center">
          <AlertDialogAction onClick={onConfirm} className="w-full">Let's Vote!</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
