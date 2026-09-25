import { Route, Routes } from 'react-router-dom';
import SiteLayout from '@app/components/SiteLayout';
import Home from '@app/pages/Home';
import Plan from '@app/pages/Plan';
import Nearby from '@app/pages/Nearby';
import Trips from '@app/pages/Trips';
import Coverage from '@app/pages/Coverage';
import HowItWorks from '@app/pages/HowItWorks';
import Faq from '@app/pages/Faq';
import About from '@app/pages/About';
import NotFound from '@app/pages/NotFound';

export default function App() {
    return (
        <Routes>
            <Route element={<SiteLayout />}>
                <Route index element={<Home />} />
                <Route path="plan" element={<Plan />} />
                <Route path="nearby" element={<Nearby />} />
                <Route path="trips" element={<Trips />} />
                <Route path="coverage" element={<Coverage />} />
                <Route path="how-it-works" element={<HowItWorks />} />
                <Route path="faq" element={<Faq />} />
                <Route path="about" element={<About />} />
                <Route path="*" element={<NotFound />} />
            </Route>
        </Routes>
    );
}
