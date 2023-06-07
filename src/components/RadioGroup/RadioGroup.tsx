import React from "react";
import styles from "./RadioGroup.module.css";

type Props = {
    children: React.ReactElement[],
}

export const RadioGroup = ({ children }: Props) => {
    return (
        <div className={styles.wrapper}>
            {children}
        </div>
    );
};
