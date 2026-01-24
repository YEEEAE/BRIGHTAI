#!/bin/bash
# cleanup_codebase.sh
# Safely deletes unused files based on user confirmation.

echo "Starting cleanup..."

# Define protected paths
PROTECTED=("old/" "Customer/")

# Function to delete if not protected
safe_delete() {
    file="$1"
    
    # Safety Check: Do not delete main directories or protected ones
    for p in "${PROTECTED[@]}"; do
        if [[ "$file" == "$p"* ]]; then
            echo "SKIPPING PROTECTED: $file"
            return
        fi
    done

    if [[ -e "$file" ]]; then
        echo "Deleting: $file"
        rm -rf "$file"
    else
        echo "File not found (already deleted?): $file"
    fi
}

# --- FILES FROM FILES_TO_DELETE.txt ---

# Immediate Deletion
safe_delete "checkout.html"
safe_delete "new_content.html"
# safe_delete "try.html"  # PROTECTED BY USER REQUEST
safe_delete "admin.html"

# System Files
safe_delete ".DS_Store"
safe_delete "Docfile/.DS_Store"
safe_delete "h/.DS_Store"
safe_delete "h/Customer-support/assets/.DS_Store"
safe_delete "h/projects/interview/pages/.DS_Store"

# Duplicate Images
safe_delete "Gemini-original.png"
safe_delete "botAI/Gemini.png"
# Ignoring Customer/Gemini.png as it is protected

# Docfile Directory
safe_delete "Docfile/agent.doc.html"
safe_delete "Docfile/anlisis.doc.html"
safe_delete "Docfile/atou.doc.html"
safe_delete "Docfile/culn.doc.html"
safe_delete "Docfile/data-analytics.doc.html"
safe_delete "Docfile/developers.webhooks.doc.html"
safe_delete "Docfile/projects.doc.html"
safe_delete "Docfile/serves.dov.html"
safe_delete "Docfile/tool.doc.html"
safe_delete "Docfile/test"

# Blogger Files (Specific junk files)
safe_delete "blogger/1212344.html"
safe_delete "blogger/3.html"
safe_delete "blogger/4.html"
safe_delete "blogger/6v5m.html"
safe_delete "blogger/viewport.HTML"
safe_delete "blogger/vvhh.html"
safe_delete "blogger/xsxd.html"
safe_delete "blogger/description.html"
safe_delete "blogger/compypterrrr.html"
safe_delete "blogger/dxftt.html"
safe_delete "blogger/rc542.html"
safe_delete "blogger/rcc.html"

echo "Cleanup complete."
