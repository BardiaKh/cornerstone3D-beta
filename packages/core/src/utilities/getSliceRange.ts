import vtkMatrixBuilder from '@kitware/vtk.js/Common/Core/MatrixBuilder';
import getVolumeActorCorners from './getVolumeActorCorners';
import type { VolumeActor, Point3, ActorSliceRange } from '../types';

/**
 * Given a `vtkVolumeActor`, and a normal direction,
 * calculate the range of slices in the focal normal direction that encapsulate
 * the volume. Also project the `focalPoint` onto this range.
 *
 * @param volumeActor - The `vtkVolumeActor`.
 * @param viewPlaneNormal - The normal to the camera view.
 * @param focalPoint - The focal point of the camera.
 *
 * @returns an object containing the `min`, `max` and `current`
 * positions in the normal direction.
 */
export default function getSliceRange(
  volumeActor: VolumeActor,
  viewPlaneNormal: Point3,
  focalPoint: Point3
): ActorSliceRange {
  const imageData = volumeActor.getMapper().getInputData();
  const [dx, dy, dz] = imageData.getDimensions();
  const cornersIdx = [
    [0, 0, 0],
    [dx, 0, 0],
    [0, dy, 0],
    [dx, dy, 0],
    [0, 0, dz],
    [dx, 0, dz],
    [0, dy, dz],
    [dx, dy, dz],
  ];
  const cornersNew = cornersIdx.map((it) => imageData.indexToWorld(it));
  const cornersOld = getVolumeActorCorners(volumeActor);
  const corners = cornersNew;

  // Get rotation matrix from normal to +X (since bounds is aligned to XYZ)
  const transform = vtkMatrixBuilder
    .buildFromDegree()
    .identity()
    .rotateFromDirections(viewPlaneNormal, [1, 0, 0]);

  corners.forEach((pt) => transform.apply(pt));

  const transformedFocalPoint = [...focalPoint];
  transform.apply(transformedFocalPoint);

  const currentSlice = transformedFocalPoint[0];

  // range is now maximum X distance
  let minX = Infinity;
  let maxX = -Infinity;
  for (let i = 0; i < 8; i++) {
    const x = corners[i][0];
    if (x > maxX) {
      maxX = x;
    }
    if (x < minX) {
      minX = x;
    }
  }

  console.log('Slice range', minX, maxX, currentSlice);

  return {
    min: minX,
    max: maxX,
    current: currentSlice,
    actor: volumeActor,
    viewPlaneNormal,
    focalPoint,
  };
}
