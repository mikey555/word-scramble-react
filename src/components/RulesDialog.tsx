import { Button } from "src/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "src/components/ui/dialog"
import {DialogClose} from "@radix-ui/react-dialog";

export function RulesDialog() {
    const buttonText = "Rules"
    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button variant="outline">{buttonText}</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle></DialogTitle>
                    <DialogDescription>

                    </DialogDescription>
                </DialogHeader>
                <div className="py-4 text-center space-y-4">
                    <div>Find the longest word you can within 60 seconds.</div>

                    <div>Longer words = more points.</div>

                    <div>The player with the most points after 5 rounds wins.</div>

                    <div>Drag to select.</div>
                    <DialogClose asChild>
                        <Button className="" variant="secondary">Close</Button>
                    </DialogClose>
                </div>
                <DialogFooter>

                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
