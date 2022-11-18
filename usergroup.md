---
title: "User Group"
permalink: "/usergroup/"
layout: page
---

Image analysis user group consists of Rockefeller University researchers who are interested in sharing knowledge and learning from each other.  
We meet regularly to discuss the latest image analysis methods, pipelines, softwares or a new paper.

Please contact [Ved Sharma](mailto:vsharma01@rockefeller.edu) at the [Bio-Imaging Resource Center](https://www.rockefeller.edu/bioimaging/), if you want to join the group.

## User Group Meetings

### 6/23/2022 meeting minutes
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

### 9/8/2022 meeting minutes
Title: "Image segmentation"  
Presenter: Ved Sharma, BIRC, The Rockefeller University  
Location/Time: 506 Greenberg Building (CRC), 2-3 pm

Following topics were discussed:
- went over the phase contrast microspoy images from one of our users and discussed the limits of classical segmentation techniques and the suitability of deep learning methods, such as [Cellpose](https://www.cellpose.org/), for chanllenging segmentation problems.
- discussed how sometimes processing raw images with classical filters (gaussian, edge detection etc.) before feeding them into deep learning pipeline produces better restults, than using the raw images.
- discussed how to train a custom model in Cellpose on user's data, for the case where the built-in Cellpose models were not good enough.
- demonstrated the use to Cellpose on another user's fluorescence microcopy images, where cells were clustering together. Cellpose did an excellent job of identifing cells in not only areas where there were fewer cells, but also in areas where cells were clustering together.
- demonstrated how to do 3D segmentation in Cellpose and then export the label image into Imaris for visualization and further analysis (e.g. filtering, cell/nuclei counting and other cellular measurements) 

### 11/17/2022 meeting minutes
Presenter: Ved Sharma, BIRC, The Rockefeller University  
Location/Time: A Level Training/Classrom, Welch Hall, 2-3 pm

Following topics were discussed:
- A user presetned his pipeline for nuclei segmentation and colocalization of IF and FISH spots using Fiji plugin called [ComDet](https://imagej.net/plugins/spots-colocalization-comdet).
- To be completed...
- 
