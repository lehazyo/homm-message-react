import React from "react";
import { HommButton } from "../HommButton/HommButton";
import { settingsStore } from "../App/App";

export const ShareButton = () => {
    const [canShare, setCanShare] = React.useState<boolean>(false);

    /** Checks if navigator supports Web Share API */
    React.useEffect(() => {
        (async () => {
            const canvasElement = document.createElement("canvas");
            const dataUrl = canvasElement.toDataURL();
            const blob = await (await fetch(dataUrl)).blob();
            const filesArray = [
                new File(
                    [blob],
                    'animation.png',
                    {
                        type: blob.type,
                        lastModified: new Date().getTime()
                    }
                )
            ];
            const shareData = {
                files: filesArray,
            };
            if (navigator.canShare(shareData)) {
                setCanShare(true);
            }
        })();
    }, []);

    if (!canShare) {
        return null;
    }

    const share = (): void => {
        if (settingsStore.shareData === undefined) {
            return;
        }
        navigator.share(settingsStore.shareData);
    }

    return (
        <HommButton onClick={share}>Share</HommButton>
    )
};
