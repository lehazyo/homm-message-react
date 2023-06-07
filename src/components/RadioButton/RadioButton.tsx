import React from "react";
import styles from "./RadioButton.module.css";

type Props = {
    label: string,
    name: string,
    value: string,
    checked?: boolean,
    set: (value: string) => void,
};

export const RadioButton = ({ label, name, value, checked, set }: Props) => {
    return (
        <label className={styles.wrapper}>
            <input type="radio" name={name} value={value} checked={checked} onChange={() => { set(value) }} />
            <span className={styles.icon} />
            <span className={styles.label}>{label}</span>
        </label>
    );
};
