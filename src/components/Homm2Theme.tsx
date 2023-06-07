import React from "react";
import { RadioGroup } from "./RadioGroup/RadioGroup";
import { RadioButton } from "./RadioButton/RadioButton";
import { settingsStore } from "./App/App";
import { InputBlock } from "./InputBlock/InputBlock";
import { observer } from "mobx-react-lite";

export const Homm2Theme = observer(() => {
    return (
        <InputBlock headerLabel="Theme:" className="input-wrapper-homm2-theme">
            <RadioGroup>
                <RadioButton
                    label="Good"
                    name="homm2-theme"
                    value="good"
                    set={() => { settingsStore.setHomm2Theme("good") }}
                    checked={settingsStore.homm2Theme === "good"}
                />
                <RadioButton
                    label="Evil"
                    name="homm2-theme"
                    value="evil"
                    set={() => { settingsStore.setHomm2Theme("evil") }}
                    checked={settingsStore.homm2Theme === "evil"}
                />
            </RadioGroup>
        </InputBlock>
    )
});
