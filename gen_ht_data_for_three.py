from halftone import Halftone 


path = "/home/kevin/Documents/side_projects/half_tone_display/IMG_4299.jpg"
ht = Halftone(path)
ht.make(style="grayscale", 
        sample=25,
        save_channels_style="grayscale", 
        output_quality=100,
        antialias=True)
