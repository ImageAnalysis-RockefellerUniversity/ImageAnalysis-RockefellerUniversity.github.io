---
title: "User Group"
permalink: "/usergroup/"
layout: page
---

Image analysis user group consists of Rockefeller University researchers who are interested in sharing knowledge and learning from each other.  
We meet regularly to discuss the latest image analysis methods, pipelines, softwares or a new paper.

Please contact [Ved Sharma](mailto:vsharma01@rockefeller.edu) at the [Bio-Imaging Resource Center](https://www.rockefeller.edu/bioimaging/), for more details.

## User Group Meetings

---
### 11/07/2024 meeting  
Presenter: Ved Sharma, BIRC, The Rockefeller University  
Location/Time: 506 Greenberg Building (CRC), 2-3 pm  

- Spoke about scripting-based batch processing in [Fiji](https://imagej.net/software/fiji/) (macro) vs [QuPath](https://qupath.readthedocs.io/en/stable/) (Groovy)
- With real user data, compared a Fiji [macro](https://imagej.net/scripting/macro) vs QuPath [Groovy](https://qupath.readthedocs.io/en/stable/docs/scripting/index.html) batch processing pipeline
- Discussed how to decide the best software for batch processing.
- Though QuPath Groovy scripting has a steep learning curve, it can provide most optimal batch processing expereience compared to Fiji macros in terms of time, effort and reproducibility.

---

### 5/23/2024 meeting  
Presenter: Ved Sharma, BIRC, The Rockefeller University  
Location/Time: 406 Greenberg Building (CRC), 2-3 pm  

Based on the user survery results during the registation, the top two topics were discussed in this meeting:
1. **How to use ImageJ/Fiji more effectively**  
   Discussed different ImageJ/Fiji features for the efficient navigation and working with ROIs and multiple images simultaneously:
   - Search bar (e.g. Split channels)
   - Shortcuts: in-built and custom (often used commands, e.g. save as TIFF)
   - [Action Bar](https://imagej.net/plugins/action-bar) plugin
   - Control panel (demo w/ LUTs)
   - Right click options
   - Synchronize Windows, Tile
   - Moving ROIs around using Synchronize Windows, Restore Selection and ROI Manager
2. **Cell/particle segmentation and counting**  
    - Discussed a user project on 3D segmentation of nuclei and coutning of colocalized and non-colocalized red and green particles inside and outside the nucleus
    - A custom image and data analysis pipeline was described, which was developed using a combination of commerical and open-source software: Huygens, Fiji, Cellpose, Imaris, Excel, GraphPad Prism  

---

### 10/11/2023 meeting  
Title: "Multiplexed image analysis using [QuPath](https://qupath.github.io/) and deep learning tools"  
Presenter: Ved Sharma, BIRC, The Rockefeller University  
Location/Time: 506 Greenberg Building (CRC), 3-4 pm  

---

### 3/29/2023 meeting
Title: "3D segmentation using Deep Learning"  
Presenter: Ved Sharma, BIRC, The Rockefeller University  
Location/Time: 506 Greenberg Building (CRC), 2-3 pm

- Spoke about checking the Z-stack voxel size and viewing it along all dimensions (XY, YZ, XZ) using orthogonal views or reslicing, before proceeding with 3D segmentation
- Discussed a few 3D segmentation tools availbale in Fiji - [3D Objects Counter](https://imagej.net/plugins/3d-objects-counter) and [3D ROI Manager](https://imagej.net/imagej-wiki-static/3D_ImageJ_Suite), and their limitations
- Talked about 3D segmentation using commercial software - [Imaris](https://imaris.oxinst.com/) and its deep learning limitations
- Discussed a few user examples of 3D segmentation (Orientia bacteria, neurons in zebrafish brain and glomeruli in ant brain) using open-source deep learning methods - [StarDist](https://github.com/stardist/stardist) and [Cellpose](https://github.com/MouseLand/cellpose)  

---

### 11/17/2022 meeting
Presenter: Ved Sharma, BIRC, The Rockefeller University  
Location/Time: A Level Training/Classrom, Welch Hall, 2-3 pm

- Discueed a pipeline I worked out for a user for nuclei segmentation using Cellpose and colocalization of IF and FISH spots inside nuclei using Fiji plugin called [ComDet](https://imagej.net/plugins/spots-colocalization-comdet).
- Batch process a folder full of images using Cellpose by running a Python script in Jupyter notebook
- Batch processing options in ImageJ/Fiji
- CellProfiler pipeline for batch processing
- Discussed literature on [Cell Painting](https://www.nature.com/articles/nprot.2016.105) and how CellProfiler could be used to process high-content screening data  

---

### 9/8/2022 meeting
Title: "Image segmentation"  
Presenter: Ved Sharma, BIRC, The Rockefeller University  
Location/Time: 506 Greenberg Building (CRC), 2-3 pm

- went over the phase contrast microspoy images from one of our users and discussed the limits of classical segmentation techniques and the suitability of deep learning methods, such as [Cellpose](https://www.cellpose.org/), for chanllenging segmentation problems.
- discussed how sometimes processing raw images with classical filters (gaussian, edge detection etc.) before feeding them into deep learning pipeline produces better restults, than using the raw images.
- discussed how to train a custom model in Cellpose on user's data, for the case where the built-in Cellpose models were not good enough.
- demonstrated the use to Cellpose on another user's fluorescence microcopy images, where cells were clustering together. Cellpose did an excellent job of identifing cells in not only areas where there were fewer cells, but also in areas where cells were clustering together.
- demonstrated how to do 3D segmentation in Cellpose and then export the label image into Imaris for visualization and further analysis (e.g. filtering, cell/nuclei counting and other cellular measurements) 

---

### 6/23/2022 meeting
Title: "How do I do “X” in ImageJ/Fiji?"  
Presenter: Ved Sharma, BIRC, The Rockefeller University  
Location/Time: 506 Greenberg Building (CRC), 2-3 pm

Following topics were discussed:
- Efficient menu and commands nagivation in ImageJ/Fiji with search bar, shortcuts, Action bar plugin and control panel
- Demonstrated "Synchronize Windows" feature for multichannel images; Wand tool for quickly outlining cells
- Set Measurements options
- Automated cell counting in fluorescence and color (RGB) images
- Described a pipeline for the quantification of nuclear and cytoplasmic localization of IF signal
- Tips on figure generation such as savings files as PNG, using Overlay option to annotate images and described some plugins such as QuickFigures,  OMERO.figure and FigureJ

---
