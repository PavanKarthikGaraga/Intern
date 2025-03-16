export async function POST(request) {
    try {
        const { link } = await request.json();

        // Check if it's a OneDrive link
        const isOneDrive = link.includes('1drv.ms') || link.includes('onedrive.live.com');

        if (isOneDrive) {
            // For OneDrive links, consider them valid if they match the expected format
            // This is because OneDrive public links may not allow direct access checks
            const oneDrivePattern = /^https:\/\/(1drv\.ms|onedrive\.live\.com)/i;
            const valid = oneDrivePattern.test(link);
            
            return Response.json({ 
                valid,
                status: valid ? 200 : 400,
                type: 'onedrive'
            });
        }

        // For other links, try HEAD request first
        try {
            const response = await fetch(link, {
                method: 'HEAD',
            });
            return Response.json({ 
                valid: response.ok,
                status: response.status,
                type: 'other'
            });
        } catch (error) {
            // If HEAD fails, try GET as fallback
            const response = await fetch(link);
            return Response.json({ 
                valid: response.ok,
                status: response.status,
                type: 'other'
            });
        }
    } catch (error) {
        return Response.json({ 
            valid: false,
            error: 'Failed to validate link',
            type: 'error'
        });
    }
}
