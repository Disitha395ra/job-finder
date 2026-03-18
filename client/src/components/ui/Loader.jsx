import './Loader.css';

const Loader = ({ inline = false, text = '' }) => {
    if (inline) {
        return (
            <span className="loader-inline">
                <span className="loader-spinner" />
                {text && <span>{text}</span>}
            </span>
        );
    }

    return (
        <div className="loader-overlay">
            <div className="loader-spinner" />
        </div>
    );
};

export default Loader;
