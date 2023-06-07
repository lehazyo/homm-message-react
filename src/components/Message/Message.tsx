import React from "react";
import { InputBlock } from "../InputBlock/InputBlock";
import { settingsStore } from "../App/App";
import { observer } from "mobx-react-lite";
import styles from "./Message.module.css";

export const Message = observer(() => {
    return (
        <InputBlock className={styles.wrapper} headerLabel="Message text:">
            <textarea className={styles.input} value={settingsStore.text} onChange={(e) => { settingsStore.setText(e.target.value); }} />
        </InputBlock>
    );
});
