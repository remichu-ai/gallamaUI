import {assets} from "../../assets/assets.js";
import React from "react";

const LandingComponent = () => {
    return (
        <div className="landing-component">
            <div className="greet">
                <p><span>Hello</span></p>
                <p>How can I help you today?</p>
            </div>
            <div className="cards" style={{width: '60%'}}>
                <div className="card">
                    <p>Briefly summarize this concept: urban planning</p>
                    <img src={assets.bulb_icon} alt=""/>
                </div>
                <div className="card">
                    <p>Brainstorm team bonding activities for our work retreat</p>
                    <img src={assets.message_icon} alt=""/>
                </div>
                <div className="card">
                    <p>Web search and research</p>
                    <img src={assets.code_icon} alt=""/>
                </div>
                <div className="card">
                    <p>Web search and research</p>
                    <img src={assets.code_icon} alt=""/>
                </div>
            </div>
        </div>
    )
}

export {LandingComponent};