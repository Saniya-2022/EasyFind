import { useState, useEffect } from "react";

function ClaimedItemDetails({ item }) {
    const [expanded, setExpanded] = useState(false);
    const [enlargedImage, setEnlargedImage] = useState(null);

    // Prevent body scroll when image is enlarged
    useEffect(() => {
        if (enlargedImage) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'auto';
        }
    }, [enlargedImage]);

    const formatDate = (timestamp) => {
        if (!timestamp) return "N/A";
        return new Date(timestamp).toLocaleString();
    };

    return (
        <div className="mt-2 p-3 border rounded-md bg-gray-50 text-sm">
            {/* Compact View */}
            <div className="flex justify-between items-center">
                <div>
                    <p><strong>Name:</strong> {item.claimerDetails?.name || "N/A"}</p>
                    <p><strong>Roll No:</strong> {item.claimerDetails?.rollNo || "N/A"}</p>
                    <p><strong>Contact:</strong> {item.claimerDetails?.contact || "N/A"}</p>
                </div>
                <button
                    className="text-blue-500 text-xs underline"
                    onClick={() => setExpanded(!expanded)}
                >
                    {expanded ? "Hide" : "Details"}
                </button>
            </div>

            {/* Expanded View */}
            {expanded && (
                <div className="mt-2 border-t pt-2 text-xs space-y-1">
                    <p><strong>Handovered On:</strong> {formatDate(item.claimerDetails?.dateHandovered)}</p>
                    <p><strong>Reporter Roll No:</strong> {item.reporterRollNo || "N/A"}</p>

                    {item.image?.url && (
                        <img 
                            src={item.image.url} 
                            alt="Found Item" 
                            className="w-20 h-20 object-cover rounded-md border cursor-pointer hover:opacity-80 transition-opacity"
                            onClick={() => setEnlargedImage(item.image.url)}
                        />
                    )}

                    {item.claimerDetails?.proofs?.length > 0 && (
                        <div className="flex gap-2 overflow-x-auto">
                            {item.claimerDetails.proofs.map((proof, index) => (
                                <img 
                                    key={index} 
                                    src={proof.url} 
                                    alt={`Proof ${index + 1}`} 
                                    className="w-20 h-20 object-cover rounded-md border cursor-pointer hover:opacity-80 transition-opacity"
                                    onClick={() => setEnlargedImage(proof.url)}
                                />
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Enlarged Image Overlay */}
            {enlargedImage && (
                <div 
                    className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4"
                    onClick={() => setEnlargedImage(null)}
                >
                    <div className="relative max-w-4xl w-full max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
                        <img 
                            src={enlargedImage} 
                            alt="Enlarged preview" 
                            className="max-w-full max-h-full object-contain rounded-lg"
                        />
                        <button
                            className="absolute -top-8 right-0 text-white hover:text-gray-200 transition-colors"
                            onClick={() => setEnlargedImage(null)}
                            aria-label="Close enlarged view"
                        >
                            <svg 
                                className="w-8 h-8"
                                fill="none" 
                                stroke="currentColor" 
                                viewBox="0 0 24 24" 
                                xmlns="http://www.w3.org/2000/svg"
                            >
                                <path 
                                    strokeLinecap="round" 
                                    strokeLinejoin="round" 
                                    strokeWidth={2} 
                                    d="M6 18L18 6M6 6l12 12" 
                                />
                            </svg>
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

export default ClaimedItemDetails;