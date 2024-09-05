import { createRoot } from 'react-dom/client'
import ErrorBoundary from './ErrorBoundary'
import Main from './Main'
// import webEyeSDK from '../../src/webEyeSDK'

const domNode = document.getElementById('app')
const App = () => {
    return (
        <ErrorBoundary fallback={<div>Error。。。。。</div>}>
            <h1>Hello World</h1>
            <Main></Main>
        </ErrorBoundary>
    )
}
const root = createRoot(domNode)
root.render(<App />)