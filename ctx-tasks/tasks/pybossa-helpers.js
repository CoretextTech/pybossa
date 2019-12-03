const ajv = new Ajv();

export const onTaskLoaded = () => {
  window.scrollTo({ top: 0, behavior: "smooth" }); 
}

export const validateInput = (jsonInfo, inputSchema) => {
  if (jsonInfo) {
    const valid = ajv.validate(inputSchema, jsonInfo);

    if (valid)
      return true;

    console.error(ajv.errorsText());

    alert('Invalid Input data');
    return false;
  }

  alert('No task data');
  return false;
}

export const validateOutput = (jsonAnswer, outputSchema) => {
  const valid = ajv.validate(outputSchema, jsonAnswer);

  if (!valid) {
    console.error(ajv.errorsText());

    alert('Invalid Output data!');
    return false;
  }

  return true;
}

export const getSelectedInDoc = () => {
  const selection = window.getSelection();
  const viewer = document.getElementById('viewer');

  if (selection.containsNode(viewer, true)) {
    const selectedPhrase = selection.toString();

    if (selectedPhrase.length < 100)
      return selectedPhrase;
    else
      alert('Selected part is too big!');
  }

  return null;
}

export const findInDoc = (phrase) => {
  document.dispatchEvent(new CustomEvent("findindoc", {
    detail: {
      searchText: phrase
    }
  }))
}

export const clearSelection = () => {
  document.dispatchEvent(new CustomEvent("clearselection"))
}

export const loadDocument = (url) => {
  const loadingTask = pdfjsLib.getDocument(url);
  return loadingTask.promise
    .catch(e => {
      const viewer = document.getElementById('viewer');
      viewer.innerText = 'Failed to fetch the Document!'
    })
}

export const renderPdfViewer = (pdfDocument, container) => {
  const pdfLinkService = new pdfjsViewer.PDFLinkService();
  
  const pdfFindController = new pdfjsViewer.PDFFindController({
    linkService: pdfLinkService,
  });
  
  const pdfViewer = new pdfjsViewer.PDFViewer({
    container: container,
    linkService: pdfLinkService,
    findController: pdfFindController,
  });

  pdfLinkService.setViewer(pdfViewer);

  document.addEventListener('pagesinit', function () {
    pdfViewer.currentScaleValue = 'page-width';
    container.scrollTop = 20;
  });

  document.addEventListener('findindoc', (e) => {
    const searchText = e && e.detail && e.detail.searchText
  
    if (searchText) {
      pdfFindController.executeCommand('find', {
        query: searchText,
        highlightAll: true,
        phraseSearch: true
      });
    }
  });

  document.addEventListener('clearselection', (e) => {
    const selection = window.getSelection();

    if (selection)
      selection.empty ? selection.empty() : selection.removeAllRanges();

    pdfFindController && pdfFindController.executeCommand('find', {
      query: '',
      highlightAll: true,
      phraseSearch: true
    });
  });
  
  pdfViewer.setDocument(pdfDocument);
  pdfLinkService.setDocument(pdfDocument, null);
}