import React from "react";
import cn from "classnames";
import { observer } from "mobx-react-lite";
import { InputBlock } from "../InputBlock/InputBlock";
import { settingsStore } from "../App/App";
import styles from "./PlayerColor.module.css";
import { Homm3PlayerColor } from "../../types";

const colors: Homm3PlayerColor[] = [ "red", "blue", "orange", "green", "brown", "violet", "teal", "pink" ];

export const PlayerColor = observer(() => {
    return (
        <InputBlock headerLabel="Player color:" className="input-wrapper-colors">
            <div className={styles.wrapper}>
                {colors.map((color) => (
                    <div
                        key={color}
                        className={cn(
                            styles.item,
                            styles[color],
                            { [styles.selected]: color === settingsStore.homm3PlayerColor },
                        )}
                        onClick={() => { settingsStore.setPlayerColor(color) }}
                    />
                ))}
            </div>
        </InputBlock>
    );
});
