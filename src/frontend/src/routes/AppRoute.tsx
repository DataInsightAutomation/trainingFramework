import { BrowserRouter, Route, Switch } from "react-router-dom";
import HomePage from "../pages/home/HomePage";
import WebUi from "../pages/webUi/webUi";
import 'bootstrap/dist/css/bootstrap.min.css';

export const AppRoute = () => {
    return (
        <BrowserRouter>
            <Switch>
                {/* <Route exact path="/" render={() => (
                        <HomePage />
                )} /> */}
                <Route path="/" component={WebUi} />
                <Route path="/webui" component={WebUi} />
            </Switch>
        </BrowserRouter>
    );
}