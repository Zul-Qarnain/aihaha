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
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Bot, User } from "lucide-react";
import type { Player } from "@/types";

interface PlayerKickedDialogProps {
  player: Player | null;
  isOpen: boolean;
  onClose: () => void;
}

export function PlayerKickedDialog({ player, isOpen, onClose }: PlayerKickedDialogProps) {
  if (!player) return null;

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent className="text-center">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex flex-col items-center gap-4 text-2xl font-headline">
            <Avatar className="w-24 h-24 border-4 border-destructive">
                <AvatarImage src={player.avatar} />
                <AvatarFallback>{player.name.charAt(0)}</AvatarFallback>
            </Avatar>
            {player.name} has been voted out!
          </AlertDialogTitle>
          <AlertDialogDescription className="text-lg flex items-center justify-center gap-2">
            Their role was: 
            {player.isAi ? (
                <span className="font-bold text-destructive flex items-center gap-1"><Bot className="w-5 h-5" /> AI</span>
            ) : (
                <span className="font-bold text-green-500 flex items-center gap-1"><User className="w-5 h-5" /> Human</span>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="sm:justify-center">
          <AlertDialogAction onClick={onClose}>Continue</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
