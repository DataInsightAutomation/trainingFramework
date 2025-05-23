import { BrowserRouter, Route, Switch } from "react-router-dom";
import HomePage from "../pages/home/HomePage";
import WebUi from "../pages/webUi/webUi";

export const AppRoute = () => {
    return (
        <BrowserRouter>
            <Switch>
                <Route exact path="/" render={() => (
                        <HomePage />
                )} />
                <Route path="/webui" component={WebUi} />
            </Switch>
        </BrowserRouter>
    );
}